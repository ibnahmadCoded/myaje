from flask import Blueprint, request, jsonify, make_response
from datetime import datetime, timedelta
import jwt
from .models import User, TokenBlacklist
from . import db, bcrypt
from .utils import token_required
from flask import current_app as app

auth = Blueprint('auth', __name__)

@auth.route('/signup', methods=['POST'])
def signup():
    data = request.json
    if User.query.filter_by(email=data['email']).first():
        return jsonify({'message': 'Email already registered'}), 400

    hashed_password = bcrypt.generate_password_hash(data['password']).decode('utf-8')
    user = User(
        email=data['email'],
        password=hashed_password,
        business_name=data['business_name']
    )
    db.session.add(user)
    db.session.commit()

    return jsonify({'message': 'User created successfully'}), 201

@auth.route('/login', methods=['POST'])
def login():
    data = request.json
    user = User.query.filter_by(email=data['email']).first()

    if user and bcrypt.check_password_hash(user.password, data['password']):
        token = jwt.encode(
            {'user_id': user.id, 'exp': datetime.utcnow() + timedelta(hours=24)},
            app.config['SECRET_KEY'],
            algorithm="HS256"
        )
        return jsonify({
            'token': token,
            'user': {
                'id': user.id,
                'email': user.email,
                'business_name': user.business_name
            }
        })

    return jsonify({'message': 'Invalid credentials'}), 401

@auth.route('/logout', methods=['POST', 'OPTIONS'])
def logout():
    if request.method == 'OPTIONS':
        response = make_response()
        response.status_code = 200
        response.headers['Access-Control-Allow-Origin'] = 'http://localhost:3000'
        response.headers['Access-Control-Allow-Methods'] = 'POST, OPTIONS'
        response.headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type'
        response.headers['Access-Control-Allow-Credentials'] = 'true'
        
        return response
    
    token = request.headers.get('Authorization')
    if token:
        try:
            token = token.split()[1] if ' ' in token else token
            # Add token to blacklist
            blacklisted_token = TokenBlacklist(token=token)
            db.session.add(blacklisted_token)
            db.session.commit()

            return jsonify({'message': 'Successfully logged out'}), 200
        except Exception as e:
            return jsonify({'message': f'Error during logout: {str(e)}'}), 400
    return jsonify({'message': 'Token is required for logout'}), 401

@auth.route('/validate-token', methods=['POST'])
def validate_token():
    token = request.headers.get('Authorization')
    
    if not token:
        return jsonify({'message': 'No token provided'}), 401
    
    try:
        # Remove 'Bearer ' prefix if present
        token = token.split()[1] if ' ' in token else token
        
        # Check if token is blacklisted
        blacklisted = TokenBlacklist.query.filter_by(token=token).first()
        if blacklisted:
            return jsonify({'message': 'Token is invalid'}), 401
        
        # Decode the token
        payload = jwt.decode(token, app.config['SECRET_KEY'], algorithms=['HS256'])
        
        # Optional: Check if token is expired
        if payload['exp'] < datetime.utcnow().timestamp():
            return jsonify({'message': 'Token has expired'}), 401
        
        # Token is valid
        return jsonify({
            'message': 'Token is valid', 
            'user_id': payload['user_id']
        }), 200
    
    except jwt.ExpiredSignatureError:
        return jsonify({'message': 'Token has expired'}), 401
    except jwt.InvalidTokenError:
        return jsonify({'message': 'Invalid token'}), 401
    except Exception as e:
        return jsonify({'message': 'Token validation failed'}), 400
