from fastapi import APIRouter, Depends, HTTPException, Request, status
from fastapi.responses import JSONResponse
from fastapi.security import OAuth2PasswordBearer
import pytz
from sqlalchemy.orm import Session
from jose import jwt, JWTError
from datetime import datetime, timedelta
from pytz import timezone
from config import SECRET_KEY, ALGORITHM, SUPER_ADMIN_EMAIL, SUPER_ADMIN_PASSWORD

from sql_database import get_db
from models import User, TokenBlacklist
from passlib.context import CryptContext

router = APIRouter()
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

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
    
    return {"message": "User created successfully"}

@router.post("/login")
async def login(request: Request, db: Session = Depends(get_db)):
    data = await request.json()
    user = db.query(User).filter_by(email=data['email']).first()
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
                'active_view': user.active_view
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
                'business_name': user.business_name
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