"""
ChainTrack Configuration
Environment-specific settings for the application
"""

import os
from datetime import timedelta
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


def get_database_url():
    """
    Get database URL with proper handling for different providers.
    - Heroku/Railway use 'postgres://' which SQLAlchemy 1.4+ doesn't support
    - We need to replace 'postgres://' with 'postgresql://'
    """
    database_url = os.environ.get('DATABASE_URL', '')
    
    # Handle Heroku-style postgres:// URLs
    if database_url.startswith('postgres://'):
        database_url = database_url.replace('postgres://', 'postgresql://', 1)
    
    return database_url


class Config:
    """Base configuration with shared settings"""
    
    # Flask
    SECRET_KEY = os.environ.get('SECRET_KEY')
    if not SECRET_KEY:
        raise ValueError("SECRET_KEY environment variable must be set")
    
    # Database
    SQLALCHEMY_TRACK_MODIFICATIONS = False
    
    # JWT
    JWT_SECRET_KEY = os.environ.get('JWT_SECRET_KEY')
    if not JWT_SECRET_KEY:
        raise ValueError("JWT_SECRET_KEY environment variable must be set")
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(hours=1)
    JWT_REFRESH_TOKEN_EXPIRES = timedelta(days=30)
    
    # CORS
    CORS_ORIGINS = os.environ.get('CORS_ORIGINS', 'http://localhost:5173').split(',')
    
    # Blockchain
    ETHEREUM_NETWORK = os.environ.get('ETHEREUM_NETWORK', 'sepolia')
    ETHEREUM_RPC_URL = os.environ.get('ETHEREUM_RPC_URL', '')
    CONTRACT_ADDRESS = os.environ.get('CONTRACT_ADDRESS', '')
    SHIPMENT_REGISTRY_ADDRESS = os.environ.get('SHIPMENT_REGISTRY_ADDRESS', '')
    
    # QR Code
    QR_CODE_BASE_URL = os.environ.get('QR_CODE_BASE_URL', 'http://localhost:5173/verify')
    
    # Pinata/IPFS Configuration
    PINATA_API_KEY = os.environ.get('PINATA_API_KEY', '')
    PINATA_API_SECRET = os.environ.get('PINATA_API_SECRET', '')
    PINATA_JWT = os.environ.get('PINATA_JWT', '')
    PINATA_GATEWAY_URL = os.environ.get('PINATA_GATEWAY_URL', 'https://gateway.pinata.cloud/ipfs')
    
    # Notification Configuration
    SENDGRID_API_KEY = os.environ.get('SENDGRID_API_KEY', '')
    NOTIFICATION_FROM_EMAIL = os.environ.get('NOTIFICATION_FROM_EMAIL', 'noreply@chaintrack.io')
    NOTIFICATION_FROM_NAME = os.environ.get('NOTIFICATION_FROM_NAME', 'ChainTrack')
    
    # Twilio SMS Configuration
    TWILIO_ACCOUNT_SID = os.environ.get('TWILIO_ACCOUNT_SID', '')
    TWILIO_AUTH_TOKEN = os.environ.get('TWILIO_AUTH_TOKEN', '')
    TWILIO_FROM_NUMBER = os.environ.get('TWILIO_FROM_NUMBER', '')
    
    # Frontend URL for notification links
    FRONTEND_URL = os.environ.get('FRONTEND_URL', 'http://localhost:5173')


class DevelopmentConfig(Config):
    """Development configuration"""
    DEBUG = True
    SQLALCHEMY_DATABASE_URI = get_database_url() or 'sqlite:///chaintrack_dev.db'


class TestingConfig(Config):
    """Testing configuration"""
    TESTING = True
    SQLALCHEMY_DATABASE_URI = 'sqlite:///:memory:'
    JWT_ACCESS_TOKEN_EXPIRES = timedelta(seconds=5)


class ProductionConfig(Config):
    """Production configuration"""
    DEBUG = False
    SQLALCHEMY_DATABASE_URI = get_database_url()
    
    # Production-specific SQLAlchemy settings
    SQLALCHEMY_ENGINE_OPTIONS = {
        'pool_pre_ping': True,  # Enable connection health checks
        'pool_recycle': 300,    # Recycle connections after 5 minutes
    }
    
    @classmethod
    def init_app(cls, app):
        """Production initialization"""
        # Ensure required config is set
        assert cls.SQLALCHEMY_DATABASE_URI, "DATABASE_URL must be set in production"
        assert app.config['SECRET_KEY'] != 'dev-secret-key-change-in-production', \
            "SECRET_KEY must be changed in production"
        
        # Log to stderr in production
        import logging
        from logging import StreamHandler
        
        stream_handler = StreamHandler()
        stream_handler.setLevel(logging.INFO)
        app.logger.addHandler(stream_handler)


# Configuration dictionary
config = {
    'development': DevelopmentConfig,
    'testing': TestingConfig,
    'production': ProductionConfig,
    'default': DevelopmentConfig
}
