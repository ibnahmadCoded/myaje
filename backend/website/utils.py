from functools import wraps
from flask import request, jsonify
import jwt
from .models import User, TokenBlacklist
from flask import current_app as app

"""def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401
        try:
            token = token.split()[1]  # Remove 'Bearer ' prefix
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])
            current_user = User.query.get(data['user_id'])
        except Exception as e:
            return jsonify({'message': f'Invalid token: {str(e)}'}), 401
        return f(current_user, *args, **kwargs)
    return decorated"""

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')
        if not token:
            return jsonify({'message': 'Token is missing'}), 401

        try:
            # Remove 'Bearer ' prefix if present
            token = token.split()[1] if ' ' in token else token

            # Check if the token is blacklisted
            blacklisted = TokenBlacklist.query.filter_by(token=token).first()
            if blacklisted:
                return jsonify({'message': 'Token is blacklisted'}), 401

            # Decode the token
            data = jwt.decode(token, app.config['SECRET_KEY'], algorithms=["HS256"])

            # Check if user exists
            current_user = User.query.get(data['user_id'])

            if not current_user:
                return jsonify({'message': 'User not found'}), 404

        except jwt.ExpiredSignatureError:
            return jsonify({'message': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'message': 'Invalid token'}), 401
        except Exception as e:
            return jsonify({'message': f'An error occurred: {str(e)}'}), 401

        return f(current_user, *args, **kwargs)

    return decorated

