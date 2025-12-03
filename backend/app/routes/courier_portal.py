"""
Courier Portal Routes
API endpoints for courier authentication, profile management, and shipment access
"""

from functools import wraps
from flask import Blueprint, request, jsonify, g
from datetime import datetime

from .. import db
from ..models import (
    Shipment, CourierAuthorization, ShipmentCheckpoint,
    CourierProfile, CourierSession, CourierActivity, CheckpointAction
)
from ..services.courier_profile_service import (
    CourierProfileService, CourierActivityService, CourierShipmentService
)
from ..services.courier_service import CourierAuthorizationService, TamperProofChainService
from ..services.shipment_blockchain_service import get_shipment_blockchain_service

bp = Blueprint('courier_portal', __name__)
bp.strict_slashes = False


def courier_auth_required(f):
    """
    Decorator to require courier authentication
    Sets g.courier_profile if authenticated
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('X-Courier-Token')
        
        if not token:
            return jsonify({'error': 'Courier authentication required'}), 401
        
        is_valid, profile = CourierProfileService.verify_session(token)
        
        if not is_valid or not profile:
            return jsonify({'error': 'Invalid or expired session'}), 401
        
        if profile.is_suspended:
            return jsonify({'error': 'Account suspended'}), 403
        
        g.courier_profile = profile
        return f(*args, **kwargs)
    
    return decorated


def courier_auth_optional(f):
    """
    Decorator that optionally loads courier profile
    Sets g.courier_profile if authenticated, None otherwise
    """
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('X-Courier-Token')
        g.courier_profile = None
        
        if token:
            is_valid, profile = CourierProfileService.verify_session(token)
            if is_valid and profile and not profile.is_suspended:
                g.courier_profile = profile
        
        return f(*args, **kwargs)
    
    return decorated


# ============================================================
# Authentication Endpoints
# ============================================================

@bp.route('/auth/request-otp', methods=['POST'])
def request_otp():
    """
    Request OTP for courier login/registration
    
    Request Body:
        - phone: string (required) - Phone number
        - display_name: string (required for new users) - Name
    
    Returns:
        Success message (OTP sent via SMS)
    """
    data = request.get_json()
    
    if not data.get('phone'):
        return jsonify({'error': 'Phone number is required'}), 400
    
    phone = data['phone'].strip()
    display_name = data.get('display_name', '').strip() or None
    
    success, message, otp = CourierProfileService.request_otp(phone, display_name)
    
    if not success:
        return jsonify({'error': message}), 400
    
    response = {'message': message}
    
    # Include OTP in development mode only (REMOVE IN PRODUCTION)
    if otp:
        response['_dev_otp'] = otp
    
    return jsonify(response), 200


@bp.route('/auth/verify-otp', methods=['POST'])
def verify_otp():
    """
    Verify OTP and create session
    
    Request Body:
        - phone: string (required)
        - otp: string (required) - 6-digit OTP
    
    Returns:
        Session token and profile data
    """
    data = request.get_json()
    
    if not data.get('phone') or not data.get('otp'):
        return jsonify({'error': 'Phone and OTP are required'}), 400
    
    phone = data['phone'].strip()
    otp = data['otp'].strip()
    
    success, message, session_data = CourierProfileService.verify_otp_and_login(
        phone=phone,
        otp=otp,
        device_info=request.headers.get('User-Agent'),
        ip_address=request.remote_addr
    )
    
    if not success:
        return jsonify({'error': message}), 401
    
    return jsonify(session_data), 200


@bp.route('/auth/register', methods=['POST'])
def register_courier():
    """
    Register a new courier with OTP verification
    
    Request Body:
        - phone: string (required)
        - otp: string (required) - 6-digit OTP
        - display_name: string (required)
        - company_name: string (optional)
        - email: string (optional)
        - vehicle_type: string (optional)
        - vehicle_plate: string (optional)
    
    Returns:
        Session token and profile data
    """
    data = request.get_json()
    
    # Validate required fields
    if not data.get('phone') or not data.get('otp'):
        return jsonify({'error': 'Phone and OTP are required'}), 400
    
    if not data.get('display_name'):
        return jsonify({'error': 'Display name is required'}), 400
    
    phone = data['phone'].strip()
    otp = data['otp'].strip()
    
    # First check if profile exists
    profile = CourierProfile.query.filter_by(phone=phone).first()
    
    if profile and profile.phone_verified:
        # Profile already exists and is verified - just login
        success, message, session_data = CourierProfileService.verify_otp_and_login(
            phone=phone,
            otp=otp,
            device_info=request.headers.get('User-Agent'),
            ip_address=request.remote_addr
        )
        
        if not success:
            return jsonify({'error': message}), 401
        
        return jsonify({
            **session_data,
            'already_registered': True
        }), 200
    
    # Verify OTP for new/unverified profile
    if profile:
        if not profile.verify_otp(otp):
            return jsonify({'error': 'Invalid or expired OTP'}), 401
        
        # Update profile with registration data
        profile.display_name = data['display_name'].strip()
        profile.company_name = data.get('company_name', '').strip() or None
        profile.email = data.get('email', '').strip() or None
        profile.vehicle_type = data.get('vehicle_type', '').strip() or None
        profile.vehicle_plate = data.get('vehicle_plate', '').strip() or None
        profile.phone_verified = True
        profile.verified_since = datetime.utcnow()
        profile.current_otp = None
        profile.otp_created_at = None
        
        db.session.commit()
    else:
        # This shouldn't happen if OTP was requested first
        return jsonify({'error': 'Please request OTP first'}), 400
    
    # Create session
    session = CourierProfileService.create_session(
        profile=profile,
        device_info=request.headers.get('User-Agent'),
        ip_address=request.remote_addr
    )
    
    # Record activity
    CourierActivityService.log_activity(
        courier_id=profile.id,
        activity_type='registration',
        description='Completed courier registration',
        ip_address=request.remote_addr
    )
    
    return jsonify({
        'message': 'Registration successful',
        'token': session.token,
        'expires_at': session.expires_at.isoformat(),
        'profile': profile.to_dict(include_stats=True),
        'registered': True
    }), 201


@bp.route('/auth/logout', methods=['POST'])
@courier_auth_required
def logout():
    """Logout and invalidate session"""
    token = request.headers.get('X-Courier-Token')
    CourierProfileService.logout(token)
    return jsonify({'message': 'Logged out successfully'}), 200


@bp.route('/auth/verify-session', methods=['GET'])
@courier_auth_required
def verify_session():
    """Verify current session is valid"""
    return jsonify({
        'valid': True,
        'profile': g.courier_profile.to_dict()
    }), 200


# ============================================================
# Profile Endpoints
# ============================================================

@bp.route('/profile', methods=['GET'])
@courier_auth_required
def get_profile():
    """Get current courier profile"""
    return jsonify(g.courier_profile.to_dict(include_stats=True)), 200


@bp.route('/profile', methods=['PUT'])
@courier_auth_required
def update_profile():
    """
    Update courier profile
    
    Request Body:
        - display_name: string
        - company_name: string
        - email: string
        - vehicle_type: string
        - vehicle_plate: string
        - profile_photo: string (base64 or URL)
    """
    data = request.get_json()
    
    profile = CourierProfileService.update_profile(
        profile_id=g.courier_profile.id,
        display_name=data.get('display_name'),
        company_name=data.get('company_name'),
        email=data.get('email'),
        vehicle_type=data.get('vehicle_type'),
        vehicle_plate=data.get('vehicle_plate'),
        profile_photo=data.get('profile_photo')
    )
    
    if not profile:
        return jsonify({'error': 'Profile not found'}), 404
    
    return jsonify(profile.to_dict(include_stats=True)), 200


@bp.route('/profile/stats', methods=['GET'])
@courier_auth_required
def get_stats():
    """Get courier statistics and recent activity"""
    stats = CourierShipmentService.get_courier_stats(g.courier_profile.id)
    return jsonify(stats), 200


# ============================================================
# Shipment Access Endpoints
# ============================================================

@bp.route('/shipments', methods=['GET'])
@courier_auth_required
def get_assigned_shipments():
    """
    Get shipments assigned to the courier
    
    Query Params:
        - status: Filter by status (pending, in_transit, delivered, etc.)
    """
    status = request.args.get('status')
    
    shipments = CourierShipmentService.get_assigned_shipments(
        courier_profile_id=g.courier_profile.id,
        status=status
    )
    
    return jsonify({
        'shipments': shipments,
        'count': len(shipments)
    }), 200


@bp.route('/shipments/<shipment_id>', methods=['GET'])
@courier_auth_optional
def get_shipment_details(shipment_id):
    """
    Get shipment details (requires auth code or logged in)
    
    Query Params:
        - auth_code: Authorization code (if not logged in)
    """
    auth_code = request.args.get('auth_code')
    
    shipment = Shipment.query.filter_by(shipment_id=shipment_id).first()
    if not shipment:
        return jsonify({'error': 'Shipment not found'}), 404
    
    # Verify authorization
    is_authorized = False
    auth = None
    
    if g.courier_profile:
        # Check if profile has authorization
        auth = CourierAuthorization.query.filter(
            CourierAuthorization.shipment_id == shipment.id,
            CourierAuthorization.is_active == True,
            db.or_(
                CourierAuthorization.courier_phone == g.courier_profile.phone,
                CourierAuthorization.courier_user_id == g.courier_profile.id
            )
        ).first()
        is_authorized = auth is not None and auth.is_valid()
    
    if not is_authorized and auth_code:
        is_auth, auth, _ = CourierAuthorizationService.verify_authorization(
            shipment=shipment,
            action='checkpoint',
            auth_code=auth_code
        )
        is_authorized = is_auth
    
    if not is_authorized:
        return jsonify({'error': 'Not authorized to view this shipment'}), 403
    
    # Get checkpoints
    checkpoints = [{
        'id': cp.id,
        'action': cp.action.value,
        'handler_name': cp.handler_name,
        'location': cp.location,
        'notes': cp.notes,
        'timestamp': cp.timestamp.isoformat(),
        'blockchain_tx': cp.blockchain_tx_hash
    } for cp in shipment.checkpoints]
    
    return jsonify({
        'shipment': {
            'id': shipment.id,
            'shipment_id': shipment.shipment_id,
            'status': shipment.status.value,
            'origin': shipment.origin,
            'destination': shipment.destination,
            'description': shipment.description,
            'weight': shipment.weight,
            'created_at': shipment.created_at.isoformat(),
            'estimated_delivery': shipment.estimated_delivery.isoformat() if shipment.estimated_delivery else None,
            'blockchain_tx': shipment.blockchain_tx_hash
        },
        'authorization': auth.to_dict() if auth else None,
        'checkpoints': checkpoints,
        'checkpoints_count': len(checkpoints)
    }), 200


# ============================================================
# Checkpoint Recording Endpoints
# ============================================================

@bp.route('/shipments/<shipment_id>/checkpoint', methods=['POST'])
@courier_auth_optional
def record_checkpoint(shipment_id):
    """
    Record a checkpoint for a shipment
    
    Requires either:
    - X-Courier-Token header (logged in courier)
    - auth_code in request body (anonymous courier)
    
    Request Body:
        - auth_code: string (required if not logged in)
        - action: string (required) - picked_up, checkpoint, in_transit, out_for_delivery, delivered
        - location: string (required)
        - notes: string (optional)
        - photo_url: string (optional)
        - gps_latitude: float (optional)
        - gps_longitude: float (optional)
    
    Returns:
        Checkpoint data with blockchain transaction
    """
    data = request.get_json()
    
    shipment = Shipment.query.filter_by(shipment_id=shipment_id).first()
    if not shipment:
        return jsonify({'error': 'Shipment not found'}), 404
    
    action = data.get('action', 'checkpoint')
    auth_code = data.get('auth_code')
    location = data.get('location')
    
    if not location:
        return jsonify({'error': 'Location is required'}), 400
    
    # Verify authorization
    auth = None
    courier_name = 'Unknown'
    
    if g.courier_profile:
        # Find authorization for this profile
        auth = CourierAuthorization.query.filter(
            CourierAuthorization.shipment_id == shipment.id,
            CourierAuthorization.is_active == True,
            db.or_(
                CourierAuthorization.courier_phone == g.courier_profile.phone,
                CourierAuthorization.courier_user_id == g.courier_profile.id
            )
        ).first()
        
        if not auth or not auth.is_valid():
            return jsonify({'error': 'Not authorized for this shipment'}), 403
        
        if not auth.can_perform_action(action):
            return jsonify({'error': f'Not authorized for action: {action}'}), 403
        
        courier_name = g.courier_profile.display_name
        
    elif auth_code:
        is_auth, auth, msg = CourierAuthorizationService.verify_authorization(
            shipment=shipment,
            action=action,
            auth_code=auth_code
        )
        
        if not is_auth:
            return jsonify({'error': msg}), 403
        
        courier_name = auth.courier_name or 'Courier'
        
        # Auto-link to profile if logged in later
        if g.courier_profile:
            CourierShipmentService.link_authorization_to_profile(auth_code, g.courier_profile.id)
    else:
        return jsonify({'error': 'Authorization required (login or auth_code)'}), 401
    
    try:
        # Map action string to enum
        action_map = {
            'picked_up': CheckpointAction.PICKED_UP,
            'checkpoint': CheckpointAction.CHECKPOINT,
            'in_transit': CheckpointAction.IN_TRANSIT,
            'out_for_delivery': CheckpointAction.OUT_FOR_DELIVERY,
            'delivered': CheckpointAction.DELIVERED
        }
        checkpoint_action = action_map.get(action, CheckpointAction.CHECKPOINT)
        
        # Create checkpoint
        checkpoint = ShipmentCheckpoint(
            shipment_id=shipment.id,
            action=checkpoint_action,
            handler_name=courier_name,
            location=location,
            notes=data.get('notes'),
            photo_url=data.get('photo_url'),
            verified=True
        )
        
        db.session.add(checkpoint)
        db.session.commit()
        
        # Add to tamper-proof chain
        chain_entry = TamperProofChainService.add_to_chain(checkpoint)
        
        # Record on blockchain
        blockchain_tx = None
        blockchain_block = None
        
        try:
            blockchain_service = get_shipment_blockchain_service()
            if blockchain_service.is_connected():
                blockchain_tx, blockchain_block = blockchain_service.record_checkpoint(
                    shipment_id=shipment.shipment_id,
                    handler_name=courier_name,
                    action=action,
                    location=location,
                    ipfs_hash=data.get('photo_url', '')[:64] if data.get('photo_url') else ''
                )
                
                checkpoint.blockchain_tx_hash = blockchain_tx
                checkpoint.blockchain_block = blockchain_block
                chain_entry.blockchain_hash = blockchain_tx
                chain_entry.blockchain_block = blockchain_block
                db.session.commit()
                
        except Exception as e:
            # Log error but don't fail the checkpoint
            print(f"Blockchain recording failed: {e}")
        
        # Record activity
        gps_coords = None
        if data.get('gps_latitude') and data.get('gps_longitude'):
            gps_coords = (data['gps_latitude'], data['gps_longitude'])
        
        activity = CourierActivityService.record_activity(
            shipment=shipment,
            activity_type='checkpoint',
            action=action,
            location=location,
            notes=data.get('notes'),
            courier_profile=g.courier_profile,
            courier_auth=auth,
            checkpoint=checkpoint,
            device_info=request.headers.get('User-Agent'),
            ip_address=request.remote_addr,
            gps_coords=gps_coords,
            record_on_chain=False  # Already recorded above
        )
        
        # Update activity with blockchain info
        if blockchain_tx:
            activity.blockchain_tx_hash = blockchain_tx
            activity.blockchain_block = blockchain_block
            db.session.commit()
        
        # Update shipment status if needed
        status_map = {
            'picked_up': 'picked_up',
            'in_transit': 'in_transit',
            'out_for_delivery': 'out_for_delivery',
            'delivered': 'delivered'
        }
        if action in status_map:
            from ..models.shipment import ShipmentStatus
            shipment.status = ShipmentStatus(status_map[action])
            shipment.updated_at = datetime.utcnow()
            db.session.commit()
        
        return jsonify({
            'success': True,
            'checkpoint': {
                'id': checkpoint.id,
                'action': checkpoint.action.value,
                'handler_name': checkpoint.handler_name,
                'location': checkpoint.location,
                'timestamp': checkpoint.timestamp.isoformat()
            },
            'chain': {
                'sequence': chain_entry.sequence_number,
                'hash': chain_entry.current_hash
            },
            'blockchain': {
                'tx_hash': blockchain_tx,
                'block': blockchain_block,
                'explorer_url': f"https://sepolia.etherscan.io/tx/{blockchain_tx}" if blockchain_tx else None
            } if blockchain_tx else None,
            'message': 'Checkpoint recorded successfully'
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


# ============================================================
# Activity History Endpoints
# ============================================================

@bp.route('/activities', methods=['GET'])
@courier_auth_required
def get_activities():
    """
    Get courier's activity history
    
    Query Params:
        - limit: int (default 50)
        - offset: int (default 0)
    """
    limit = min(int(request.args.get('limit', 50)), 100)
    offset = int(request.args.get('offset', 0))
    
    activities = CourierActivityService.get_courier_activities(
        courier_profile_id=g.courier_profile.id,
        limit=limit,
        offset=offset
    )
    
    return jsonify({
        'activities': [a.to_dict() for a in activities],
        'count': len(activities),
        'limit': limit,
        'offset': offset
    }), 200


# ============================================================
# Authorization Code Link Endpoint
# ============================================================

@bp.route('/link-authorization', methods=['POST'])
@courier_auth_required
def link_authorization():
    """
    Link an authorization code to the logged-in courier profile
    
    Request Body:
        - auth_code: string (required)
    
    This associates the auth code with the courier's verified profile,
    allowing them to see the shipment in their dashboard.
    """
    data = request.get_json()
    
    auth_code = data.get('auth_code')
    if not auth_code:
        return jsonify({'error': 'auth_code is required'}), 400
    
    # Verify the auth code exists and is valid
    auth = CourierAuthorization.query.filter_by(auth_code=auth_code).first()
    if not auth:
        return jsonify({'error': 'Invalid authorization code'}), 404
    
    if not auth.is_valid():
        return jsonify({'error': 'Authorization expired or revoked'}), 400
    
    # Link to profile
    success = CourierShipmentService.link_authorization_to_profile(
        auth_code=auth_code,
        courier_profile_id=g.courier_profile.id
    )
    
    if not success:
        return jsonify({'error': 'Failed to link authorization'}), 500
    
    return jsonify({
        'message': 'Authorization linked successfully',
        'shipment_id': auth.shipment.shipment_id,
        'authorization': auth.to_dict()
    }), 200


# ============================================================
# Public Verification Endpoint
# ============================================================

@bp.route('/verify/<shipment_id>', methods=['GET'])
def verify_shipment_chain(shipment_id):
    """
    Public endpoint to verify shipment chain integrity
    Anyone can verify the tamper-proof chain
    """
    shipment = Shipment.query.filter_by(shipment_id=shipment_id).first()
    if not shipment:
        return jsonify({'error': 'Shipment not found'}), 404
    
    # Verify chain integrity
    is_valid, results = TamperProofChainService.verify_chain_integrity(shipment.id)
    
    # Get blockchain events
    blockchain_service = get_shipment_blockchain_service()
    blockchain_events = []
    
    if blockchain_service.is_connected():
        try:
            blockchain_events = blockchain_service.get_shipment_events(shipment_id)
        except Exception as e:
            print(f"Failed to get blockchain events: {e}")
    
    return jsonify({
        'shipment_id': shipment_id,
        'status': shipment.status.value,
        'chain_integrity': {
            'is_valid': is_valid,
            'checkpoints_verified': len(results),
            'verification_results': results
        },
        'blockchain_events': blockchain_events,
        'verified_at': datetime.utcnow().isoformat()
    }), 200
