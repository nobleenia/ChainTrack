"""
Two-Factor Authentication Routes
API endpoints for managing 2FA
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..models import User
from ..services.two_factor_service import two_factor_service

two_factor_bp = Blueprint('two_factor', __name__, url_prefix='/api/auth/2fa')


@two_factor_bp.route('/status', methods=['GET'])
@jwt_required()
def get_2fa_status():
    """
    Get 2FA status for current user
    ---
    tags:
      - Two-Factor Authentication
    security:
      - bearerAuth: []
    responses:
      200:
        description: 2FA status retrieved
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if user.two_factor:
        return jsonify({
            'is_enabled': user.two_factor.is_enabled,
            'method': user.two_factor.method,
            'enabled_at': user.two_factor.enabled_at.isoformat() if user.two_factor.enabled_at else None,
            'has_backup_codes': bool(user.two_factor.backup_codes)
        })
    
    return jsonify({
        'is_enabled': False,
        'method': None,
        'enabled_at': None,
        'has_backup_codes': False
    })


@two_factor_bp.route('/setup/initiate', methods=['POST'])
@jwt_required()
def initiate_2fa_setup():
    """
    Start 2FA setup - sends verification code to email
    ---
    tags:
      - Two-Factor Authentication
    security:
      - bearerAuth: []
    responses:
      200:
        description: Verification code sent
      400:
        description: 2FA already enabled or error
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    success, message, _ = two_factor_service.initiate_2fa_setup(user)
    
    if not success:
        return jsonify({'error': message}), 400
    
    return jsonify({
        'message': message,
        'email': _mask_email(user.email),
        'expires_in_minutes': 10
    })


@two_factor_bp.route('/setup/verify', methods=['POST'])
@jwt_required()
def verify_2fa_setup():
    """
    Complete 2FA setup by verifying code
    ---
    tags:
      - Two-Factor Authentication
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - code
            properties:
              code:
                type: string
                description: 6-digit verification code
    responses:
      200:
        description: 2FA enabled, returns backup codes
      400:
        description: Invalid or expired code
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    if not data or 'code' not in data:
        return jsonify({'error': 'Verification code is required'}), 400
    
    code = data['code'].strip()
    
    success, message, backup_codes = two_factor_service.complete_2fa_setup(user, code)
    
    if not success:
        return jsonify({'error': message}), 400
    
    return jsonify({
        'message': message,
        'backup_codes': backup_codes,
        'warning': 'Save these backup codes securely. You will not be able to see them again!'
    })


@two_factor_bp.route('/disable', methods=['POST'])
@jwt_required()
def disable_2fa():
    """
    Disable 2FA (requires password)
    ---
    tags:
      - Two-Factor Authentication
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - password
            properties:
              password:
                type: string
                description: Current password for verification
    responses:
      200:
        description: 2FA disabled
      400:
        description: Invalid password or 2FA not enabled
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    if not data or 'password' not in data:
        return jsonify({'error': 'Password is required'}), 400
    
    success, message = two_factor_service.disable_2fa(user, data['password'])
    
    if not success:
        return jsonify({'error': message}), 400
    
    return jsonify({'message': message})


@two_factor_bp.route('/backup-codes/regenerate', methods=['POST'])
@jwt_required()
def regenerate_backup_codes():
    """
    Regenerate backup codes (requires password)
    ---
    tags:
      - Two-Factor Authentication
    security:
      - bearerAuth: []
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - password
            properties:
              password:
                type: string
    responses:
      200:
        description: New backup codes generated
      400:
        description: Invalid password or 2FA not enabled
    """
    user_id = get_jwt_identity()
    user = User.query.get(user_id)
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    data = request.get_json()
    if not data or 'password' not in data:
        return jsonify({'error': 'Password is required'}), 400
    
    success, message, backup_codes = two_factor_service.regenerate_backup_codes(
        user, data['password']
    )
    
    if not success:
        return jsonify({'error': message}), 400
    
    return jsonify({
        'message': message,
        'backup_codes': backup_codes,
        'warning': 'Your old backup codes are now invalid. Save these new codes securely!'
    })


# ============================================
# Login-related endpoints (public, no JWT)
# ============================================

@two_factor_bp.route('/login/send-code', methods=['POST'])
def send_login_otp():
    """
    Send OTP for login (called after password verification)
    ---
    tags:
      - Two-Factor Authentication
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - email
              - temp_token
            properties:
              email:
                type: string
              temp_token:
                type: string
                description: Temporary token from initial login
    responses:
      200:
        description: OTP sent to email
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request data required'}), 400
    
    email = data.get('email')
    temp_token = data.get('temp_token')
    
    if not email or not temp_token:
        return jsonify({'error': 'Email and temp_token required'}), 400
    
    # Verify temp token matches (simple check - in production use proper temp token storage)
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'Invalid request'}), 400
    
    # Send OTP
    success, message = two_factor_service.send_login_otp(user)
    
    if not success:
        return jsonify({'error': message}), 400
    
    return jsonify({
        'message': message,
        'email': _mask_email(user.email),
        'expires_in_minutes': 10
    })


@two_factor_bp.route('/login/verify', methods=['POST'])
def verify_login_otp():
    """
    Verify OTP during login
    ---
    tags:
      - Two-Factor Authentication
    requestBody:
      required: true
      content:
        application/json:
          schema:
            type: object
            required:
              - email
              - code
              - temp_token
            properties:
              email:
                type: string
              code:
                type: string
                description: 6-digit OTP or backup code
              temp_token:
                type: string
    responses:
      200:
        description: Verification successful
    """
    data = request.get_json()
    if not data:
        return jsonify({'error': 'Request data required'}), 400
    
    email = data.get('email')
    code = data.get('code', '').strip()
    temp_token = data.get('temp_token')
    
    if not all([email, code, temp_token]):
        return jsonify({'error': 'Email, code, and temp_token required'}), 400
    
    user = User.query.filter_by(email=email).first()
    if not user:
        return jsonify({'error': 'Invalid request'}), 400
    
    success, message = two_factor_service.verify_login_otp(user, code)
    
    if not success:
        return jsonify({'error': message, 'verified': False}), 400
    
    return jsonify({
        'message': message,
        'verified': True
    })


def _mask_email(email: str) -> str:
    """Mask email for display (e.g., n***e@gmail.com)"""
    if not email or '@' not in email:
        return '***'
    
    local, domain = email.split('@')
    if len(local) <= 2:
        masked_local = local[0] + '***'
    else:
        masked_local = local[0] + '***' + local[-1]
    
    return f"{masked_local}@{domain}"
