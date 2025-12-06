"""
ChainTrack Backend - Flask Application Factory
Blockchain-powered supply chain transparency platform
"""

import os
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

# Rate limiter (initialized in create_app)
limiter = None


def create_app(config_name='development'):
    """
    Application factory for creating Flask app instances.
    
    Args:
        config_name: Configuration environment ('development', 'testing', 'production')
    
    Returns:
        Flask application instance
    """
    global limiter
    
    app = Flask(__name__)
    
    # Load configuration
    app.config.from_object(config[config_name])
    
    # Initialize extensions with app
    db.init_app(app)
    migrate.init_app(app, db)
    jwt.init_app(app)
    
    # Initialize rate limiter
    try:
        from flask_limiter import Limiter
        from flask_limiter.util import get_remote_address
        
        limiter = Limiter(
            app=app,
            key_func=get_remote_address,
            default_limits=["200 per day", "50 per hour"],
            storage_uri=os.environ.get('REDIS_URL', 'memory://'),
        )
        
        # Apply stricter limits to auth endpoints
        @limiter.request_filter
        def exempt_health_checks():
            """Don't rate limit health check endpoints"""
            return '/api/health' in str(app.url_map)
            
    except ImportError:
        app.logger.warning("flask-limiter not installed. Rate limiting disabled.")
        limiter = None
    
    # Enable CORS for frontend communication
    CORS(app, resources={
        r"/api/*": {
            "origins": app.config.get('CORS_ORIGINS', ['http://localhost:5173', 'http://localhost:5174']),
            "methods": ["GET", "POST", "PUT", "DELETE", "PATCH"],
            "allow_headers": ["Content-Type", "Authorization", "X-Courier-Token"],
            "supports_credentials": True
        }
    })
    
    # JWT token blacklist check (uses Redis in production, in-memory fallback)
    @jwt.token_in_blocklist_loader
    def check_if_token_revoked(jwt_header, jwt_payload):
        from .services.token_blacklist_service import is_token_blacklisted
        jti = jwt_payload['jti']
        return is_token_blacklisted(jti)
    
    # Security headers for all responses
    @app.after_request
    def add_security_headers(response):
        from .utils.security import add_security_headers as apply_headers
        return apply_headers(response)
    
    # Initialize blockchain service
    from .services.blockchain_service import blockchain_service
    blockchain_service.init_app(app)
    
    # Register blueprints
    from .routes import auth, products, transfers, verification, rewards, shipments, notifications, couriers, tokens
    from .routes.uploads import uploads_bp
    from .routes.courier_portal import bp as courier_portal_bp
    app.register_blueprint(auth.bp, url_prefix='/api/auth')
    app.register_blueprint(products.bp, url_prefix='/api/products')
    app.register_blueprint(transfers.bp, url_prefix='/api/transfers')
    app.register_blueprint(verification.bp, url_prefix='/api/verify')
    app.register_blueprint(rewards.bp, url_prefix='/api/rewards')
    app.register_blueprint(shipments.bp, url_prefix='/api/shipments')
    app.register_blueprint(uploads_bp, url_prefix='/api/uploads')
    app.register_blueprint(notifications.bp, url_prefix='/api/notifications')
    app.register_blueprint(couriers.bp, url_prefix='/api/couriers')
    app.register_blueprint(courier_portal_bp, url_prefix='/api/courier-portal')
    app.register_blueprint(tokens.bp, url_prefix='/api/tokens')
    
    # Initialize Swagger UI for API documentation
    from .swagger import init_swagger
    init_swagger(app)
    
    # Health check endpoint
    @app.route('/api/health')
    def health_check():
        """Basic health check"""
        return {'status': 'healthy', 'service': 'chaintrack-api'}
    
    @app.route('/api/health/ready')
    def readiness_check():
        """
        Readiness check - verifies all dependencies are available.
        Used by hosting platforms to know when the app is ready to receive traffic.
        """
        checks = {
            'database': False,
            'service': 'chaintrack-api'
        }
        
        # Check database connectivity
        try:
            db.session.execute(db.text('SELECT 1'))
            checks['database'] = True
        except Exception as e:
            app.logger.error(f"Database health check failed: {e}")
            checks['database'] = False
        
        # Overall status
        all_healthy = all([checks['database']])
        checks['status'] = 'ready' if all_healthy else 'not ready'
        
        status_code = 200 if all_healthy else 503
        return checks, status_code
    
    # Shell context for flask shell
    @app.shell_context_processor
    def make_shell_context():
        from .models import User, Product, Transfer, Shipment, ShipmentCheckpoint, DeliveryProof
        return {
            'db': db,
            'User': User,
            'Product': Product,
            'Transfer': Transfer,
            'Shipment': Shipment,
            'ShipmentCheckpoint': ShipmentCheckpoint,
            'DeliveryProof': DeliveryProof
        }
    
    return app
