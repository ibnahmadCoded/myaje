import os
from flask import Flask
from flask_migrate import Migrate
from flask_sqlalchemy import SQLAlchemy
from flask_bcrypt import Bcrypt
from flask_cors import CORS

db = SQLAlchemy()
bcrypt = Bcrypt()
migrate = Migrate()

def create_app():
    app = Flask(__name__)
    app.config['SECRET_KEY'] = os.urandom(24)  # In production, use a stable secret key
    app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///myaje.db'
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

    # Initialize extensions
    db.init_app(app)
    bcrypt.init_app(app)
    migrate.init_app(app, db)
    #CORS(app)
    CORS(app, 
     resources={r"/*": {"origins": "http://localhost:3000"}}, 
     supports_credentials=True, 
     allow_headers=["Content-Type", "Authorization"],
     methods=["GET", "POST", "OPTIONS"])

    # Register blueprints
    from .auth import auth
    from .views import views
    app.register_blueprint(auth, url_prefix="/")
    app.register_blueprint(views, url_prefix="/")

    with app.app_context():
        db.create_all()

    return app
