import os
import structlog
import logging

# Logging setup
# Set up the basic configuration for the standard logging module
logging.basicConfig(level=logging.INFO)

# Configure structlog to integrate with logging
structlog.configure(
    logger_factory=structlog.stdlib.LoggerFactory(),
    wrapper_class=structlog.make_filtering_bound_logger(logging.INFO),
    processors=[
        structlog.stdlib.add_logger_name,
        structlog.stdlib.add_log_level,
        structlog.processors.TimeStamper(fmt="iso"),
        structlog.processors.JSONRenderer()
    ]
)

logger = structlog.get_logger(__name__)

# Environment variables and settings
#UPLOAD_FOLDER = "./uploaded_docs/"
#os.makedirs(UPLOAD_FOLDER, exist_ok=True)

UPLOAD_PATH = os.getenv('UPLOAD_PATH', "/uploaded_images") 
UPLOAD_DIRECTORY = os.getenv('UPLOAD_DIRECTORY', "uploaded_images") 
os.makedirs(UPLOAD_DIRECTORY, exist_ok=True)

if not os.path.exists(UPLOAD_DIRECTORY):
    os.makedirs(UPLOAD_DIRECTORY)

# set up db url
#SQLALCHEMY_DATABASE_URL = os.getenv('DB_TYPE', "sqlite:///./") + os.getenv('DB_NAME', "myaje_app.db")
SQLALCHEMY_DATABASE_URL = os.getenv('DB_TYPE', "postgresql://") + \
    f"{os.getenv('DB_USER', 'postgres')}:{os.getenv('DB_PASSWORD', 'alegeaa')}@" + \
    f"{os.getenv('DB_HOST', 'localhost')}:{os.getenv('DB_PORT', '5432')}/" + \
    os.getenv('DB_NAME', 'myaje')

# Read secret key from file
SECRET_KEY_PATH = os.getenv('SECRET_KEY_PATH', './secrets/appsecret.txt')

try:
    with open(SECRET_KEY_PATH, 'r') as secret_file:
        SECRET_KEY = secret_file.read().strip()
except FileNotFoundError:
    # Fallback to a default or raise an error
    SECRET_KEY = "somesecret"
ALGORITHM = "HS256"

SMTP_USERNAME = os.getenv("SMTP_USERNAME")
SMTP_PASSWORD = os.getenv("SMTP_PASSWORD")
SMTP_SERVER = os.getenv("SMTP_SERVER") 
SMTP_PORT = int(os.getenv("SMTP_PORT", "587"))
SUPER_ADMIN_EMAIL = os.getenv("SUPER_ADMIN_EMAIL", "admin@yourdomain.com")
SUPER_ADMIN_PASSWORD = os.getenv("SUPER_ADMIN_PASSWORD", "adminpassword123")
FRONTEND_URL = allow_origins=[os.getenv("FRONTEND_URL", "http://localhost:3000")]
BASE_API_PREFIX = os.getenv("NEXT_PUBLIC_API_BASE_URL", "/api")