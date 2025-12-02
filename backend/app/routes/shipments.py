"""
Shipment Routes
API endpoints for P2P delivery/courier system
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from datetime import datetime

from .. import db
from ..models import Shipment, ShipmentStatus, CheckpointAction
from ..services.shipment_service import ShipmentService

bp = Blueprint('shipments', __name__)
bp.strict_slashes = False


def get_optional_user_id():
    """Get user ID if authenticated, None otherwise"""
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        return int(identity) if identity else None
    except:
        return None


@bp.route('/', methods=['POST'])
@jwt_required()
def create_shipment():
    """
    Create a new shipment
    
    Request Body:
        - receiver_name: string (required)
        - description: string (required)
        - pickup_address: string (required)
        - delivery_address: string (required)
        - receiver_email: string (optional)
        - receiver_phone: string (optional)
        - package_type: string (optional)
        - weight: string (optional)
        - dimensions: string (optional)
        - declared_value: float (optional)
        - special_instructions: string (optional)
        - pickup_city: string (optional)
        - delivery_city: string (optional)
        - sender_photo_url: string (optional but recommended)
        - sender_photo_ipfs_hash: string (optional)
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    # Validate required fields
    required = ['receiver_name', 'description', 'pickup_address', 'delivery_address']
    for field in required:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Must have at least one contact method for receiver
    if not data.get('receiver_email') and not data.get('receiver_phone'):
        return jsonify({'error': 'Either receiver_email or receiver_phone is required'}), 400
    
    try:
        shipment = ShipmentService.create_shipment(
            sender_id=current_user_id,
            receiver_name=data['receiver_name'],
            description=data['description'],
            pickup_address=data['pickup_address'],
            delivery_address=data['delivery_address'],
            receiver_email=data.get('receiver_email'),
            receiver_phone=data.get('receiver_phone'),
            package_type=data.get('package_type'),
            weight=data.get('weight'),
            dimensions=data.get('dimensions'),
            declared_value=data.get('declared_value'),
            special_instructions=data.get('special_instructions'),
            pickup_city=data.get('pickup_city'),
            delivery_city=data.get('delivery_city'),
            sender_photo_url=data.get('sender_photo_url'),
            sender_photo_ipfs_hash=data.get('sender_photo_ipfs_hash')
        )
        
        return jsonify({
            'message': 'Shipment created successfully',
            'shipment': shipment.to_dict(include_pin=True)
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/', methods=['GET'])
@jwt_required()
def list_shipments():
    """
    List shipments for current user
    
    Query params:
        - role: 'sent', 'handling', or 'all' (default: 'all')
        - status: filter by status
    """
    current_user_id = int(get_jwt_identity())
    role = request.args.get('role', 'all')
    status_filter = request.args.get('status')
    
    shipments = ShipmentService.get_user_shipments(current_user_id, role)
    
    # Filter by status if provided
    if status_filter:
        try:
            status = ShipmentStatus(status_filter)
            shipments = [s for s in shipments if s.status == status]
        except ValueError:
            pass
    
    # Get stats
    stats = ShipmentService.get_shipment_stats(current_user_id)
    
    return jsonify({
        'shipments': [s.to_dict(include_checkpoints=False) for s in shipments],
        'stats': stats,
        'count': len(shipments)
    }), 200


@bp.route('/<shipment_id>', methods=['GET'])
def get_shipment(shipment_id):
    """
    Get shipment details
    
    Requires either:
    - JWT authentication (if sender or handler)
    - tracking_pin query parameter
    """
    user_id = get_optional_user_id()
    tracking_pin = request.args.get('pin')
    
    shipment = Shipment.query.filter_by(shipment_id=shipment_id).first()
    
    if not shipment:
        return jsonify({'error': 'Shipment not found'}), 404
    
    # Verify access
    if not ShipmentService.verify_access(shipment, user_id, tracking_pin):
        return jsonify({'error': 'Access denied. Provide correct PIN or login as sender/handler'}), 403
    
    # Include PIN only for sender
    include_pin = user_id and shipment.sender_id == user_id
    
    return jsonify({
        'shipment': shipment.to_dict(include_pin=include_pin)
    }), 200


@bp.route('/<shipment_id>/qr', methods=['GET'])
@jwt_required()
def get_shipment_qr(shipment_id):
    """Get QR code data for shipment (sender only)"""
    current_user_id = int(get_jwt_identity())
    
    shipment = Shipment.query.filter_by(shipment_id=shipment_id).first()
    
    if not shipment:
        return jsonify({'error': 'Shipment not found'}), 404
        
    if shipment.sender_id != current_user_id:
        return jsonify({'error': 'Only sender can access QR code'}), 403
    
    qr_data = ShipmentService.generate_qr_data(shipment)
    
    return jsonify({
        'qr_data': qr_data,
        'shipment_id': shipment.shipment_id,
        'tracking_pin': shipment.tracking_pin
    }), 200


@bp.route('/<shipment_id>/checkpoint', methods=['POST'])
def record_checkpoint(shipment_id):
    """
    Record a checkpoint/scan event
    
    Can be called by:
    - Registered user (with JWT)
    - Anyone with PIN (for flexibility with courier riders)
    
    Request Body:
        - action: string (required) - picked_up, checkpoint, handed_off, out_for_delivery, delivered
        - pin: string (required if not authenticated)
        - location: string (optional)
        - notes: string (optional)
        - handler_name: string (optional, for non-registered handlers)
        - photo_url: string (optional)
        - photo_ipfs_hash: string (optional)
    """
    user_id = get_optional_user_id()
    data = request.get_json()
    
    shipment = Shipment.query.filter_by(shipment_id=shipment_id).first()
    
    if not shipment:
        return jsonify({'error': 'Shipment not found'}), 404
    
    # Verify access - need either auth or PIN
    tracking_pin = data.get('pin')
    if not ShipmentService.verify_access(shipment, user_id, tracking_pin):
        return jsonify({'error': 'Access denied. Provide PIN or login'}), 403
    
    # Validate action
    action_str = data.get('action')
    if not action_str:
        return jsonify({'error': 'action is required'}), 400
        
    try:
        action = CheckpointAction(action_str)
    except ValueError:
        valid_actions = [a.value for a in CheckpointAction if a not in [CheckpointAction.CREATED, CheckpointAction.CONFIRMED]]
        return jsonify({'error': f'Invalid action. Valid: {valid_actions}'}), 400
    
    # Can't use CREATED or CONFIRMED through this endpoint
    if action in [CheckpointAction.CREATED, CheckpointAction.CONFIRMED]:
        return jsonify({'error': f'Action {action.value} not allowed via checkpoint endpoint'}), 400
    
    # Check shipment status allows this action
    if shipment.status == ShipmentStatus.CONFIRMED:
        return jsonify({'error': 'Shipment already confirmed, no more checkpoints allowed'}), 400
    
    if shipment.status == ShipmentStatus.CANCELLED:
        return jsonify({'error': 'Shipment is cancelled'}), 400
    
    try:
        checkpoint = ShipmentService.record_checkpoint(
            shipment=shipment,
            action=action,
            handler_id=user_id,
            handler_name=data.get('handler_name'),
            location=data.get('location'),
            notes=data.get('notes'),
            photo_url=data.get('photo_url'),
            photo_ipfs_hash=data.get('photo_ipfs_hash')
        )
        
        return jsonify({
            'message': f'Checkpoint recorded: {action.value}',
            'checkpoint': checkpoint.to_dict(),
            'shipment_status': shipment.status.value
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<shipment_id>/confirm', methods=['POST'])
def confirm_delivery(shipment_id):
    """
    Confirm delivery with proof (receiver endpoint)
    
    Requires PIN (shared with receiver by sender)
    
    Request Body:
        - pin: string (required)
        - photo_url: string (required)
        - receiver_name: string (optional, defaults to shipment receiver)
        - receiver_relationship: string (optional) - Self, Family, Security, etc.
        - signature_data: string (optional) - Base64 encoded signature
        - condition_notes: string (optional)
        - photo_ipfs_hash: string (optional)
    """
    data = request.get_json()
    
    shipment = Shipment.query.filter_by(shipment_id=shipment_id).first()
    
    if not shipment:
        return jsonify({'error': 'Shipment not found'}), 404
    
    # Verify PIN
    if not data.get('pin') or shipment.tracking_pin != data['pin']:
        return jsonify({'error': 'Invalid tracking PIN'}), 403
    
    # Check status
    if shipment.status == ShipmentStatus.CONFIRMED:
        return jsonify({'error': 'Delivery already confirmed'}), 400
    
    if shipment.status == ShipmentStatus.CANCELLED:
        return jsonify({'error': 'Shipment is cancelled'}), 400
    
    # Photo is required for confirmation
    if not data.get('photo_url'):
        return jsonify({'error': 'Photo proof is required for confirmation'}), 400
    
    try:
        proof = ShipmentService.confirm_delivery(
            shipment=shipment,
            photo_url=data['photo_url'],
            receiver_name=data.get('receiver_name'),
            receiver_relationship=data.get('receiver_relationship'),
            signature_data=data.get('signature_data'),
            condition_notes=data.get('condition_notes'),
            photo_ipfs_hash=data.get('photo_ipfs_hash')
        )
        
        return jsonify({
            'message': 'Delivery confirmed successfully!',
            'delivery_proof': proof.to_dict(),
            'shipment_status': shipment.status.value
        }), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/<shipment_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_shipment(shipment_id):
    """
    Cancel a shipment (sender only, before delivery)
    
    Request Body:
        - reason: string (optional)
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    
    shipment = Shipment.query.filter_by(shipment_id=shipment_id).first()
    
    if not shipment:
        return jsonify({'error': 'Shipment not found'}), 404
    
    if shipment.sender_id != current_user_id:
        return jsonify({'error': 'Only sender can cancel shipment'}), 403
    
    try:
        ShipmentService.cancel_shipment(shipment, data.get('reason'))
        
        return jsonify({
            'message': 'Shipment cancelled',
            'shipment_status': shipment.status.value
        }), 200
        
    except ValueError as e:
        return jsonify({'error': str(e)}), 400
    except Exception as e:
        db.session.rollback()
        return jsonify({'error': str(e)}), 500


@bp.route('/track/<shipment_id>', methods=['POST'])
def track_shipment(shipment_id):
    """
    Public tracking endpoint (requires PIN)
    
    Request Body:
        - pin: string (required)
    """
    data = request.get_json()
    
    if not data or not data.get('pin'):
        return jsonify({'error': 'Tracking PIN is required'}), 400
    
    tracking_info = ShipmentService.get_tracking_info(shipment_id, data['pin'])
    
    if not tracking_info:
        return jsonify({'error': 'Invalid shipment ID or PIN'}), 404
    
    return jsonify(tracking_info), 200


@bp.route('/scan', methods=['POST'])
def scan_shipment():
    """
    Scan QR code endpoint - returns shipment info for courier app
    
    Request Body:
        - shipment_id: string (required) - from QR code
        - pin: string (required if not authenticated)
    """
    user_id = get_optional_user_id()
    data = request.get_json()
    
    if not data or not data.get('shipment_id'):
        return jsonify({'error': 'shipment_id is required'}), 400
    
    shipment = Shipment.query.filter_by(shipment_id=data['shipment_id']).first()
    
    if not shipment:
        return jsonify({'error': 'Shipment not found'}), 404
    
    # Verify access
    tracking_pin = data.get('pin')
    if not ShipmentService.verify_access(shipment, user_id, tracking_pin):
        return jsonify({'error': 'Access denied. Provide PIN'}), 403
    
    return jsonify({
        'shipment_id': shipment.shipment_id,
        'status': shipment.status.value,
        'description': shipment.description,
        'package_type': shipment.package_type,
        'special_instructions': shipment.special_instructions,
        'sender_name': shipment.sender.name if shipment.sender else 'Unknown',
        'sender_photo_url': shipment.sender_photo_url,
        'receiver_name': shipment.receiver_name,
        'delivery_address': shipment.delivery_address,
        'delivery_city': shipment.delivery_city,
        'checkpoint_count': shipment.checkpoints.count(),
        'can_record_checkpoint': shipment.status not in [ShipmentStatus.CONFIRMED, ShipmentStatus.CANCELLED],
        'can_confirm_delivery': shipment.status not in [ShipmentStatus.CONFIRMED, ShipmentStatus.CANCELLED]
    }), 200
