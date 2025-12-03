"""
Courier Authorization Routes
API endpoints for managing courier authorizations
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from datetime import datetime

from .. import db
from ..models import Shipment, CourierAuthorization, CheckpointChain
from ..services.courier_service import CourierAuthorizationService, TamperProofChainService

bp = Blueprint('couriers', __name__)
bp.strict_slashes = False


def get_optional_user_id():
    """Get user ID if authenticated, None otherwise"""
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        return int(identity) if identity else None
    except:
        return None


@bp.route('/shipments/<shipment_id>/authorize', methods=['POST'])
@jwt_required()
def authorize_courier(shipment_id):
    """
    Authorize a courier for a shipment
    
    Request Body:
        - courier_user_id: int (optional) - Registered user ID
        - courier_name: string (required if no user_id) - Courier name
        - courier_phone: string (optional) - Courier phone
        - can_pickup: bool (default: true)
        - can_checkpoint: bool (default: true)
        - can_deliver: bool (default: true)
        - can_handoff: bool (default: false)
        - expires_in_hours: int (optional, default: 48)
    
    Returns:
        Authorization details including auth_code
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    # Find shipment
    shipment = Shipment.query.filter_by(shipment_id=shipment_id).first()
    if not shipment:
        return jsonify({'error': 'Shipment not found'}), 404
    
    # Must provide either user_id or name
    if not data.get('courier_user_id') and not data.get('courier_name'):
        return jsonify({'error': 'Either courier_user_id or courier_name is required'}), 400
    
    try:
        auth = CourierAuthorizationService.authorize_courier(
            shipment=shipment,
            authorized_by_id=current_user_id,
            courier_user_id=data.get('courier_user_id'),
            courier_name=data.get('courier_name'),
            courier_phone=data.get('courier_phone'),
            can_pickup=data.get('can_pickup', True),
            can_checkpoint=data.get('can_checkpoint', True),
            can_deliver=data.get('can_deliver', True),
            can_handoff=data.get('can_handoff', False),
            expires_in_hours=data.get('expires_in_hours', 48)
        )
        
        return jsonify({
            'message': 'Courier authorized successfully',
            'authorization': auth.to_dict(include_code=True)
        }), 201
        
    except PermissionError as e:
        return jsonify({'error': str(e)}), 403
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/shipments/<shipment_id>/authorizations', methods=['GET'])
@jwt_required()
def list_authorizations(shipment_id):
    """
    List all courier authorizations for a shipment
    Only sender can view
    """
    current_user_id = int(get_jwt_identity())
    
    shipment = Shipment.query.filter_by(shipment_id=shipment_id).first()
    if not shipment:
        return jsonify({'error': 'Shipment not found'}), 404
    
    if shipment.sender_id != current_user_id:
        return jsonify({'error': 'Only sender can view authorizations'}), 403
    
    authorizations = CourierAuthorizationService.get_shipment_authorizations(shipment.id)
    
    return jsonify({
        'authorizations': [a.to_dict(include_code=True) for a in authorizations],
        'count': len(authorizations)
    }), 200


@bp.route('/authorizations/<int:auth_id>/revoke', methods=['POST'])
@jwt_required()
def revoke_authorization(auth_id):
    """Revoke a courier authorization"""
    current_user_id = int(get_jwt_identity())
    
    try:
        success = CourierAuthorizationService.revoke_authorization(auth_id, current_user_id)
        if success:
            return jsonify({'message': 'Authorization revoked'}), 200
        return jsonify({'error': 'Authorization not found'}), 404
        
    except PermissionError as e:
        return jsonify({'error': str(e)}), 403
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/verify-auth', methods=['POST'])
def verify_authorization():
    """
    Verify if a courier is authorized for an action
    
    Request Body:
        - shipment_id: string (required)
        - action: string (required) - picked_up, checkpoint, delivered, etc.
        - auth_code: string (optional)
    """
    user_id = get_optional_user_id()
    data = request.get_json()
    
    if not data.get('shipment_id') or not data.get('action'):
        return jsonify({'error': 'shipment_id and action are required'}), 400
    
    shipment = Shipment.query.filter_by(shipment_id=data['shipment_id']).first()
    if not shipment:
        return jsonify({'error': 'Shipment not found'}), 404
    
    is_authorized, auth, message = CourierAuthorizationService.verify_authorization(
        shipment=shipment,
        action=data['action'],
        auth_code=data.get('auth_code'),
        user_id=user_id
    )
    
    return jsonify({
        'authorized': is_authorized,
        'message': message,
        'authorization': auth.to_dict() if auth else None
    }), 200 if is_authorized else 403


@bp.route('/shipments/<shipment_id>/chain', methods=['GET'])
def get_checkpoint_chain(shipment_id):
    """
    Get the tamper-proof checkpoint chain for a shipment
    Public endpoint - anyone with shipment_id can verify
    """
    shipment = Shipment.query.filter_by(shipment_id=shipment_id).first()
    if not shipment:
        return jsonify({'error': 'Shipment not found'}), 404
    
    chain_data = TamperProofChainService.get_chain_for_shipment(shipment.id)
    
    return jsonify({
        'shipment_id': shipment_id,
        'chain_integrity': chain_data
    }), 200


@bp.route('/shipments/<shipment_id>/verify-integrity', methods=['GET'])
def verify_chain_integrity(shipment_id):
    """
    Verify the integrity of a shipment's checkpoint chain
    Returns detailed verification for each checkpoint
    """
    shipment = Shipment.query.filter_by(shipment_id=shipment_id).first()
    if not shipment:
        return jsonify({'error': 'Shipment not found'}), 404
    
    is_valid, results = TamperProofChainService.verify_chain_integrity(shipment.id)
    
    return jsonify({
        'shipment_id': shipment_id,
        'chain_valid': is_valid,
        'checkpoints_verified': len(results),
        'verification_results': results,
        'verified_at': datetime.utcnow().isoformat()
    }), 200
