"""
ChainTrack Backend - Flask Application Factory
Blockchain-powered supply chain transparency platform
"""

from flask import Flask
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from flask_cors import CORS
from flask_jwt_extended import JWTManager

from .config import config

# Initialize extensions
db = SQLAlchemy()
migrate = Migrate()
jwt = JWTManager()


def create_app(config_name='development'):
    """
    Application factory for creating Flask app instances.
    
    Args:
        config_name: Configuration environment ('development', 'testing', 'production')
    
    Returns:
        Flask application instance
    """
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Enable CORS for frontend communication
    CORS(app, resources={
        r"/api/*": {
            "origins": app.config.get('CORS_ORIGINS', ['http://localhost:5173']),
            "methods": ["GET", "POST", "PUT", "DELETE", "PATCH"],
            "allow_headers": ["Content-Type", "Authorization"]
        }
    })
    
    # Register blueprints
    from .routes import auth, products, transfers, verification, rewards
    app.register_blueprint(auth.bp, url_prefix='/api/auth')
    app.register_blueprint(products.bp, url_prefix='/api/products')
    app.register_blueprint(transfers.bp, url_prefix='/api/transfers')
    app.register_blueprint(verification.bp, url_prefix='/api/verify')
    app.register_blueprint(rewards.bp, url_prefix='/api/rewards')
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        return {'status': 'healthy', 'service': 'chaintrack-api'}
    
    # Shell context for flask shell
    @app.shell_context_processor
    def make_shell_context():
        from .models import User, Product, Transfer
        return {
            'db': db,
            'User': User,
            'Product': Product,
            'Transfer': Transfer
        }
    
    return app
