from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
import pytz
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from datetime import datetime, timedelta, timezone
from typing import Optional
from utils.notification_service import NotificationService
from config import SECRET_KEY, ALGORITHM, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD

from sql_database import get_db
from models import User, TokenBlacklist, OTPVerification
from passlib.context import CryptContext

class OptionalOAuth2PasswordBearer(OAuth2PasswordBearer):
    async def __call__(self, request: Request) -> Optional[str]:
        authorization: str = request.headers.get("Authorization")
        if not authorization:
            return None
        return await super().__call__(request)

router = APIRouter()
notification_service = NotificationService()

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")
oauth2_scheme_optional = OptionalOAuth2PasswordBearer(tokenUrl="token")

def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

def create_access_token(data: dict, expires_delta: timedelta = timedelta(hours=24)):
    to_encode = data.copy()
    expire = datetime.utcnow() + expires_delta
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: str = Depends(oauth2_scheme), db: Session = Depends(get_db)):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        # Decode the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Extract user ID or email from the token
        user_id = payload.get('user_id')
        if user_id is None:
            raise credentials_exception
        
        # Find the user in the database
        user = db.query(User).filter(User.id == user_id).first()
        if user is None:
            raise credentials_exception
        
        return user
    
    except JWTError:
        raise credentials_exception
    
async def get_optional_current_user(
    token: Optional[str] = Depends(oauth2_scheme_optional), 
    db: Session = Depends(get_db)
) -> Optional[User]:
    if not token:
        return None
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get('user_id')
        if user_id is None:
            return None
        user = db.query(User).filter(User.id == user_id).first()
        return user
    except JWTError:
        return None

async def get_admin_user(
    current_user: User = Depends(get_current_user)
) -> User:
    
    if not current_user.is_admin:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized to access admin resources"
        )
    return current_user

async def create_super_admin(db: Session):
    """Create super admin user if it doesn't exist"""
    super_admin_email = SUPER_ADMIN_EMAIL
    super_admin_password = SUPER_ADMIN_PASSWORD
    
    existing_admin = db.query(User).filter(
        User.email == super_admin_email,
        User.is_admin == True,
        User.admin_role == "super_admin",
    ).first()
    
    if not existing_admin:
        super_admin = User(
            email=super_admin_email,
            password=pwd_context.hash(super_admin_password),
            is_admin=True,
            admin_role="super_admin",
            last_login = datetime.now(pytz.utc),
            is_verified = True
        )
        
        db.add(super_admin)
        db.commit()
        print(f"Super admin created with email: {super_admin_email}")

def format_phone_number(phone: str) -> str:
    # Remove non-numeric characters
    numeric_phone = ''.join(filter(str.isdigit, phone))
    # Add country code +234
    return f"+234{numeric_phone[-10:]}"

@router.post("/signup")
async def signup(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    
    if db.query(User).filter_by(email=data['email']).first():
        raise HTTPException(status_code=400, detail="Email already registered")
    
    hashed_password = get_password_hash(data['password'])
    
    # Determine account type
    account_type = data.get('account_type', 'personal')
    has_business = account_type == 'business'
    
    user = User(
        email=data['email'],
        password=hashed_password,
        has_business_account=has_business,
        has_personal_account=True,
        phone=data['phone'],
        active_view='business' if has_business else 'personal'
    )
    
    if has_business:
        user.business_name = data['business_name']
        user.generate_store_slug(db=db)
    
    try:
        db.add(user)
        db.commit()
        db.refresh(user)
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Error creating user")
    
     # Send OTP
    try:
        formatted_phone = format_phone_number(data['phone'])
        await notification_service.send_otp_notification(
            email=data['email'],
            phone=formatted_phone,
            notification_type="verification",
            db=db
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail="Failed to send verification code")
    
    return {"message": "Verification code sent"}

@router.post("/verify-signup")
async def verify_signup(request: Request, db: Session = Depends(get_db)):
    data = await request.json()

    pending_user = db.query(User).filter_by(email=data['email'], is_verified=False, phone=data['phone']).first()
    
    if not pending_user:
        raise HTTPException(status_code=400, detail="No pending registration found")
    
    # Verify OTP
    is_valid = await notification_service.verify_otp(
        email=pending_user.email,
        phone=format_phone_number(pending_user.phone),
        otp=data["otp"],
        notification_type="verification",
        db=db
    )
    
    if not is_valid:
        raise HTTPException(status_code=400, detail="Invalid or expired verification code")
    
    try:
        pending_user.is_verified = True
        db.commit()
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=400, detail="Error creating user")
    
    return {"message": "User verified and created successfully"}

@router.post("/resend-otp")
async def resend_otp(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    
    # Validate required fields
    if not data.get('email') or not data.get('phone'):
        raise HTTPException(
            status_code=400, 
            detail="Both email and phone are required"
        )
    
    # Find unverified user
    user = db.query(User).filter_by(
        email=data['email'], 
        phone=data['phone'], 
        is_verified=False
    ).first()
    
    if not user:
        raise HTTPException(
            status_code=400, 
            detail="No pending verification found for this email and phone"
        )
    
    # Check if there's a recent OTP that hasn't expired yet
    recent_otp = db.query(OTPVerification).filter(
        OTPVerification.email == data['email'],
        OTPVerification.phone == format_phone_number(data['phone']),
        OTPVerification.type == "verification",
        OTPVerification.expires_at > datetime.utcnow(),
        OTPVerification.used_at.is_(None)
    ).first()
    
    # If there's a recent valid OTP, optionally prevent spam
    if recent_otp:
        time_since_last_otp = datetime.utcnow().replace(tzinfo=timezone.utc) - recent_otp.created_at
        if time_since_last_otp.total_seconds() < 30:  # 30-second cooldown
            raise HTTPException(
                status_code=400,
                detail="Please wait before requesting a new code"
            )
    
    # Send new OTP
    try:
        formatted_phone = format_phone_number(data['phone'])
        await notification_service.send_otp_notification(
            email=data['email'],
            phone=formatted_phone,
            notification_type="verification",
            db=db
        )
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail="Failed to send verification code"
        )
    
    return {"message": "New verification code sent successfully"}

@router.post("/login")
async def login(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    user = db.query(User).filter_by(email=data['email']).first()

    if not user.is_verified:
        raise HTTPException(status_code=400, detail="You are not verified")
    
    if user and verify_password(data['password'], user.password):
        user.last_login = datetime.utcnow()
        db.commit()
        
        token = create_access_token({'user_id': user.id})
        return {
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'phone': user.phone,
                'business_name': user.business_name,
                'has_business_account': user.has_business_account,
                'has_personal_account': user.has_personal_account,
                'active_view': user.active_view,
            },
            'businessBankingOnboarded': user.business_banking_onboarded, 
            'personalBankingOnboarded': user.personal_banking_onboarded
        }
    raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/toggle-view")
async def toggle_view(
    request: Request,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    data = await request.json()
    new_view = data.get('view')
    
    if new_view not in ['personal', 'business']:
        raise HTTPException(status_code=400, detail="Invalid view type")
        
    if new_view == 'business' and not current_user.has_business_account:
        # If user doesn't have business account, they need to create one
        business_name = data.get('business_name')
        if not business_name:
            raise HTTPException(
                status_code=400, 
                detail="Business name required to enable business account"
            )
        current_user.business_name = business_name
        current_user.has_business_account = True
        current_user.generate_store_slug(db=db)
        
    current_user.active_view = new_view
    db.commit()
    
    return {
        "message": "View updated successfully",
        "active_view": new_view,
        "has_business_account": current_user.has_business_account
    }

@router.post("/admin/login")
async def admin_login(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    user = db.query(User).filter_by(email=data['email']).first()

    if user and user.is_admin and verify_password(data['password'], user.password):
        # Update last_login field
        user.last_login = datetime.utcnow()
        db.commit()

        token = create_access_token({'user_id': user.id})
        return {
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'business_name': user.business_name,
                'active_view': 'admin'
            }
        }

    raise HTTPException(status_code=401, detail="Invalid credentials")

@router.post("/logout")
async def logout(request: Request, db: Session = Depends(get_db)):
    auth_header = request.headers.get('Authorization', '')
    
    # Better token extraction
    try:
        token_type, token = auth_header.split()
        if token_type.lower() != 'bearer':
            raise ValueError("Invalid token type")
    except ValueError:
        raise HTTPException(
            status_code=401, 
            detail="Invalid Authorization header format. Expected 'Bearer <token>'"
        )

    try:
        # Validate the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Check if token is already blacklisted
        existing_token = db.query(TokenBlacklist).filter(
            TokenBlacklist.token == token
        ).first()
        
        if existing_token:
            return JSONResponse(content={"message": "Already logged out"})
        
        # Blacklist token
        blacklisted_token = TokenBlacklist(token=token)
        db.add(blacklisted_token)
        db.commit()
        
        response = JSONResponse(content={"message": "Successfully logged out"})
        response.headers["Access-Control-Allow-Origin"] = "http://localhost:3000"
        response.headers["Access-Control-Allow-Credentials"] = "true"
        
        return response
    
    except jwt.ExpiredSignatureError:
        return JSONResponse(
            status_code=401,
            content={"message": "Token has expired"}
        )
    except jwt.InvalidTokenError as e:
        return JSONResponse(
            status_code=401,
            content={"message": f"Invalid token: {str(e)}"}
        )
    except Exception as e:
        db.rollback()
        print(f"Logout error: {str(e)}")
        raise HTTPException(status_code=500, detail="Internal server error during logout")

@router.post("/validate-token")
async def validate_token(request: Request, db: Session = Depends(get_db)):
    token = request.headers.get('Authorization', '')
    
    if not token:
        raise HTTPException(status_code=401, detail="No token provided")
    
    try:
        # Remove 'Bearer ' prefix if present
        token = token.split()[1] if ' ' in token else token
        
        # Check if token is blacklisted
        blacklisted = db.query(TokenBlacklist).filter_by(token=token).first()
        if blacklisted:
            raise HTTPException(status_code=401, detail="Token is invalid")
        
        # Decode the token
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        
        # Check if token is expired
        if payload['exp'] < datetime.utcnow().timestamp():
            raise HTTPException(status_code=401, detail="Token has expired")
        
        # Token is valid
        return {
            'message': 'Token is valid', 
            'user_id': payload['user_id']
        }
    
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token has expired")
    #except jwt.InvalidTokenError:
        #raise HTTPException(status_code=401, detail="Invalid token")
    except Exception:
        raise HTTPException(status_code=400, detail="Token validation failed")
    