"""
Authentication Routes
User registration, login, and token management
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import (
    create_access_token, create_refresh_token,
    jwt_required, get_jwt_identity, get_jwt
)
from datetime import datetime

from .. import db, limiter
from ..models import User, UserRole
from ..utils.security import (
    validate_password, AccountLockoutManager, 
    get_client_ip, mask_email, sanitize_input
)
from ..services.token_blacklist_service import add_token_to_blacklist, is_token_blacklisted

bp = Blueprint('auth', __name__)


def apply_rate_limit(limit_string):
    """Apply rate limit if limiter is available"""
    def decorator(f):
        if limiter:
            return limiter.limit(limit_string)(f)
        return f
    return decorator


@bp.route('/register', methods=['POST'])
@apply_rate_limit("5 per minute")
def register():
    """
    Register a new user
    
    Request Body:
        - email: string (required)
        - password: string (required)
        - name: string (required)
        - role: string (optional, default: consumer)
        - company_name: string (optional)
        - phone: string (optional)
    """
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['email', 'password', 'name']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Sanitize inputs
    email = sanitize_input(data.get('email', ''), 120).lower()
    name = sanitize_input(data.get('name', ''), 100)
    
    # Validate password strength
    is_valid, error_msg = validate_password(data['password'])
    if not is_valid:
        return jsonify({'error': error_msg}), 400
    
    # Check if user already exists
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'Email already registered'}), 409
    
    # Validate role
    role_str = data.get('role', 'consumer').lower()
    try:
        role = UserRole(role_str)
    except ValueError:
        return jsonify({'error': f'Invalid role. Must be one of: {[r.value for r in UserRole]}'}), 400
    
    # Create new user
    user = User(
        email=email,
        name=name,
        role=role,
        company_name=sanitize_input(data.get('company_name', ''), 200),
        phone=sanitize_input(data.get('phone', ''), 20),
        wallet_address=data.get('wallet_address')
    )
    user.set_password(data['password'])
    user.ensure_user_id()  # Generate unique user_id
    
    db.session.add(user)
    db.session.commit()
    
    # Process referral code if provided
    referral_processed = False
    if data.get('referral_code'):
        try:
            from ..services.rewards_service import RewardsService
            referral = RewardsService.process_referral(
                data['referral_code'].upper().strip(),
                user.id
            )
            if referral:
                referral_processed = True
        except Exception as e:
            # Don't fail registration if referral processing fails
            pass
    
    # Send welcome notification
    try:
        from ..services.in_app_notification_service import in_app_notification_service
        in_app_notification_service.welcome_user(user.id)
    except Exception as e:
        # Don't fail registration if notification fails
        pass
    
    # Generate tokens (use string identity for Flask-JWT-Extended compatibility)
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    
    response_data = {
        'message': 'User registered successfully',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }
    
    if referral_processed:
        response_data['referral_applied'] = True
        response_data['message'] = 'User registered successfully with referral bonus!'
    
    return jsonify(response_data), 201


@bp.route('/login', methods=['POST'])
@apply_rate_limit("10 per minute")
def login():
    """
    Authenticate user and return tokens
    
    Request Body:
        - email: string (required)
        - password: string (required)
    """
    data = request.get_json()
    
    if not data.get('email') or not data.get('password'):
        return jsonify({'error': 'Email and password are required'}), 400
    
    email = sanitize_input(data.get('email', ''), 120).lower()
    
    # Check account lockout
    is_locked, seconds_remaining = AccountLockoutManager.is_locked(email)
    if is_locked:
        minutes = seconds_remaining // 60 + 1
        return jsonify({
            'error': f'Account temporarily locked. Try again in {minutes} minutes.',
            'locked': True,
            'retry_after': seconds_remaining
        }), 429
    
    user = User.query.filter_by(email=email).first()
    
    if not user or not user.check_password(data['password']):
        # Record failed attempt
        is_now_locked, remaining = AccountLockoutManager.record_failed_attempt(email)
        
        if is_now_locked:
            return jsonify({
                'error': 'Too many failed attempts. Account temporarily locked.',
                'locked': True
            }), 429
        
        return jsonify({
            'error': 'Invalid email or password',
            'attempts_remaining': remaining
        }), 401
    
    if not user.is_active:
        return jsonify({'error': 'Account is deactivated'}), 403
    
    # Clear failed attempts on successful login
    AccountLockoutManager.clear_attempts(email)
    
    # Update last login
    user.last_login = datetime.utcnow()
    db.session.commit()
    
    # Generate tokens (use string identity for Flask-JWT-Extended compatibility)
    access_token = create_access_token(identity=str(user.id))
    refresh_token = create_refresh_token(identity=str(user.id))
    
    return jsonify({
        'message': 'Login successful',
        'user': user.to_dict(),
        'access_token': access_token,
        'refresh_token': refresh_token
    }), 200


@bp.route('/logout', methods=['POST'])
@jwt_required()
def logout():
    """Logout and blacklist current token"""
    jwt_data = get_jwt()
    jti = jwt_data['jti']
    
    # Calculate remaining time until token expires
    exp_timestamp = jwt_data.get('exp', 0)
    now_timestamp = datetime.utcnow().timestamp()
    expires_in = max(0, int(exp_timestamp - now_timestamp))
    
    # Blacklist the token (persists to Redis in production)
    add_token_to_blacklist(jti, expires_in)
    
    return jsonify({'message': 'Successfully logged out'}), 200


@bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    """Refresh the access token using a valid refresh token"""
    jti = get_jwt()['jti']
    
    # Check if refresh token is blacklisted (uses Redis in production)
    if is_token_blacklisted(jti):
        return jsonify({'error': 'Token has been revoked'}), 401
    
    current_user_id = get_jwt_identity()
    access_token = create_access_token(identity=current_user_id)
    
    return jsonify({
        'access_token': access_token
    }), 200


@bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_user():
    """Get the current authenticated user's profile"""
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({'user': user.to_dict()}), 200


@bp.route('/me', methods=['PUT'])
@jwt_required()
def update_current_user():
    """Update the current user's profile"""
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    # Update allowed fields
    if 'name' in data:
        user.name = data['name']
    if 'company_name' in data:
        user.company_name = data['company_name']
    if 'phone' in data:
        user.phone = data['phone']
    if 'wallet_address' in data:
        # Validate wallet address format (basic check)
        wallet = data['wallet_address']
        if wallet and (not wallet.startswith('0x') or len(wallet) != 42):
            return jsonify({'error': 'Invalid wallet address format'}), 400
        user.wallet_address = wallet
    
    db.session.commit()
    
    return jsonify({
        'message': 'Profile updated successfully',
        'user': user.to_dict()
    }), 200


@bp.route('/change-password', methods=['POST'])
@jwt_required()
def change_password():
    """Change the current user's password"""
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    
    if not data.get('current_password') or not data.get('new_password'):
        return jsonify({'error': 'Current and new passwords are required'}), 400
    
    if not user.check_password(data['current_password']):
        return jsonify({'error': 'Current password is incorrect'}), 401
    
    # Validate new password strength
    is_valid, error_msg = validate_password(data['new_password'])
    if not is_valid:
        return jsonify({'error': error_msg}), 400
    
    user.set_password(data['new_password'])
    db.session.commit()
    
    # Send password changed notification
    try:
        from ..services.in_app_notification_service import in_app_notification_service
        in_app_notification_service.notify(user.id, 'password_changed')
    except Exception as e:
        pass  # Don't fail if notification fails
    
    return jsonify({'message': 'Password changed successfully'}), 200


@bp.route('/users/search', methods=['GET'])
@jwt_required()
def search_users():
    """
    Search for registered users by name, company name, or user ID.
    Used for finding recipients when initiating transfers.
    
    Query Parameters:
        - q: Search query (searches name, company_name, user_id)
        - role: Filter by role (optional)
        - limit: Max results (default 10, max 50)
    """
    from sqlalchemy import or_
    
    current_user_id = int(get_jwt_identity())
    query = request.args.get('q', '').strip()
    role_filter = request.args.get('role', '').strip()
    limit = min(int(request.args.get('limit', 10)), 50)
    
    if len(query) < 2:
        return jsonify({'error': 'Search query must be at least 2 characters'}), 400
    
    # Build search filter
    search_filter = or_(
        User.name.ilike(f'%{query}%'),
        User.company_name.ilike(f'%{query}%'),
        User.user_id.ilike(f'%{query}%')
    )
    
    # Base query - exclude current user and inactive users
    users_query = User.query.filter(
        search_filter,
        User.id != current_user_id,
        User.is_active == True
    )
    
    # Apply role filter if specified
    if role_filter:
        try:
            from ..models import UserRole
            role_enum = UserRole(role_filter)
            users_query = users_query.filter(User.role == role_enum)
        except ValueError:
            pass  # Invalid role, ignore filter
    
    users = users_query.limit(limit).all()
    
    return jsonify({
        'users': [u.to_public_dict() for u in users],
        'count': len(users),
        'query': query
    }), 200


@bp.route('/users/<user_id_or_id>', methods=['GET'])
@jwt_required()
def get_user_by_id(user_id_or_id):
    """
    Get a user by their user_id (e.g., MFR-ABC123) or numeric ID.
    Returns public user info only.
    """
    # Try to find by user_id first
    user = User.query.filter_by(user_id=user_id_or_id).first()
    
    # If not found, try numeric ID
    if not user and user_id_or_id.isdigit():
        user = User.query.get(int(user_id_or_id))
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    return jsonify({
        'user': user.to_public_dict()
    }), 200
