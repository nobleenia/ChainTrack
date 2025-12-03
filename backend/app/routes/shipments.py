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
    - Sender (always authorized)
    - Registered courier with JWT (if authorized)
    - Anyone with authorization code (auth_code)
    
    Request Body:
        - action: string (required) - picked_up, checkpoint, handed_off, out_for_delivery, delivered
        - auth_code: string (required if not sender or not JWT authenticated)
        - location: string (optional)
        - notes: string (optional)
        - handler_name: string (optional, for non-registered handlers)
        - photo_url: string (optional)
        - photo_ipfs_hash: string (optional)
    """
    from ..services.courier_service import CourierAuthorizationService, TamperProofChainService
    
    user_id = get_optional_user_id()
    data = request.get_json()
    
    shipment = Shipment.query.filter_by(shipment_id=shipment_id).first()
    
    if not shipment:
        return jsonify({'error': 'Shipment not found'}), 404
    
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
    
    # Verify courier authorization
    is_authorized, auth, auth_message = CourierAuthorizationService.verify_authorization(
        shipment=shipment,
        action=action_str,
        auth_code=data.get('auth_code'),
        user_id=user_id
    )
    
    if not is_authorized:
        return jsonify({
            'error': 'Not authorized to record checkpoint',
            'details': auth_message,
            'hint': 'Provide a valid auth_code or ensure you are authorized for this shipment'
        }), 403
    
    # Check shipment status allows this action
    if shipment.status == ShipmentStatus.CONFIRMED:
        return jsonify({'error': 'Shipment already confirmed, no more checkpoints allowed'}), 400
    
    if shipment.status == ShipmentStatus.CANCELLED:
        return jsonify({'error': 'Shipment is cancelled'}), 400
    
    try:
        # Get handler name from auth or request
        handler_name = data.get('handler_name')
        if not handler_name and auth:
            handler_name = auth.courier_name or (auth.courier_user.name if auth.courier_user else None)
        
        checkpoint = ShipmentService.record_checkpoint(
            shipment=shipment,
            action=action,
            handler_id=user_id,
            handler_name=handler_name,
            location=data.get('location'),
            notes=data.get('notes'),
            photo_url=data.get('photo_url'),
            photo_ipfs_hash=data.get('photo_ipfs_hash')
        )
        
        # Add to tamper-proof chain
        chain_entry = TamperProofChainService.add_to_chain(checkpoint)
        
        # Record authorization usage
        if auth:
            auth.record_usage()
        
        return jsonify({
            'message': f'Checkpoint recorded: {action.value}',
            'checkpoint': checkpoint.to_dict(),
            'chain_entry': {
                'sequence': chain_entry.sequence_number,
                'hash': chain_entry.current_hash,
                'blockchain_pending': chain_entry.blockchain_hash is None
            },
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


@bp.route('/analytics', methods=['GET'])
@jwt_required()
def get_analytics():
    """
    Get shipment analytics for the authenticated user
    
    Query params:
        - days: int (default 30) - number of days to analyze
    
    Returns analytics including:
        - summary: total counts, rates, averages
        - trends: period-over-period comparisons
        - dailyData: day-by-day metrics
        - statusBreakdown: shipments by status
        - topRoutes: most popular routes
        - courierPerformance: courier statistics
    """
    from sqlalchemy import func, case
    from datetime import timedelta
    
    current_user_id = int(get_jwt_identity())
    days = request.args.get('days', 30, type=int)
    
    # Calculate date range
    end_date = datetime.utcnow()
    start_date = end_date - timedelta(days=days)
    prev_start_date = start_date - timedelta(days=days)
    
    # Base query for user's shipments
    base_query = Shipment.query.filter(
        Shipment.sender_id == current_user_id,
        Shipment.created_at >= start_date
    )
    
    # Previous period query for comparison
    prev_query = Shipment.query.filter(
        Shipment.sender_id == current_user_id,
        Shipment.created_at >= prev_start_date,
        Shipment.created_at < start_date
    )
    
    # Get all shipments for the period
    shipments = base_query.all()
    prev_shipments = prev_query.all()
    
    # Calculate summary statistics
    total_shipments = len(shipments)
    prev_total = len(prev_shipments)
    
    delivered = [s for s in shipments if s.status in [ShipmentStatus.DELIVERED, ShipmentStatus.CONFIRMED]]
    confirmed = [s for s in shipments if s.status == ShipmentStatus.CONFIRMED]
    in_transit = [s for s in shipments if s.status == ShipmentStatus.IN_TRANSIT]
    pending = [s for s in shipments if s.status == ShipmentStatus.PENDING]
    cancelled = [s for s in shipments if s.status == ShipmentStatus.CANCELLED]
    
    delivery_rate = (len(delivered) / total_shipments * 100) if total_shipments > 0 else 0
    
    # Calculate average delivery time for delivered shipments
    delivery_times = []
    for s in confirmed:
        if s.delivered_at and s.created_at:
            hours = (s.delivered_at - s.created_at).total_seconds() / 3600
            delivery_times.append(hours)
    
    avg_delivery_time = sum(delivery_times) / len(delivery_times) if delivery_times else 0
    
    # On-time delivery rate (assuming 48 hours is on-time)
    on_time = [t for t in delivery_times if t <= 48]
    on_time_rate = (len(on_time) / len(delivery_times) * 100) if delivery_times else 0
    
    # Calculate trends
    prev_delivered = len([s for s in prev_shipments if s.status in [ShipmentStatus.DELIVERED, ShipmentStatus.CONFIRMED]])
    prev_delivery_rate = (prev_delivered / prev_total * 100) if prev_total > 0 else 0
    
    shipments_change = ((total_shipments - prev_total) / prev_total * 100) if prev_total > 0 else 0
    delivery_rate_change = delivery_rate - prev_delivery_rate
    
    # Calculate daily data
    daily_data = []
    for i in range(days):
        day_date = start_date + timedelta(days=i)
        day_end = day_date + timedelta(days=1)
        
        day_shipments = [s for s in shipments if day_date <= s.created_at < day_end]
        day_delivered = len([s for s in day_shipments if s.status in [ShipmentStatus.DELIVERED, ShipmentStatus.CONFIRMED]])
        
        # Average delivery time for that day
        day_delivery_times = []
        for s in day_shipments:
            if s.status == ShipmentStatus.CONFIRMED and s.delivered_at and s.created_at:
                hours = (s.delivered_at - s.created_at).total_seconds() / 3600
                day_delivery_times.append(hours)
        
        daily_data.append({
            'date': day_date.strftime('%Y-%m-%d'),
            'dateLabel': day_date.strftime('%b %d'),
            'created': len(day_shipments),
            'delivered': day_delivered,
            'inTransit': len([s for s in day_shipments if s.status == ShipmentStatus.IN_TRANSIT]),
            'avgDeliveryTime': sum(day_delivery_times) / len(day_delivery_times) if day_delivery_times else 0,
            'revenue': len(day_shipments) * 25.0  # Placeholder - would come from actual pricing
        })
    
    # Status breakdown
    status_colors = {
        'pending': '#f59e0b',
        'in_transit': '#3b82f6',
        'delivered': '#10b981',
        'confirmed': '#059669',
        'cancelled': '#ef4444'
    }
    
    status_breakdown = [
        {'name': 'Delivered', 'value': len(delivered), 'color': status_colors['delivered']},
        {'name': 'In Transit', 'value': len(in_transit), 'color': status_colors['in_transit']},
        {'name': 'Pending', 'value': len(pending), 'color': status_colors['pending']},
        {'name': 'Confirmed', 'value': len(confirmed), 'color': status_colors['confirmed']},
        {'name': 'Cancelled', 'value': len(cancelled), 'color': status_colors['cancelled']}
    ]
    
    # Top routes (by city pairs)
    routes = {}
    for s in shipments:
        route_key = f"{s.pickup_city or 'Unknown'}-{s.delivery_city or 'Unknown'}"
        if route_key not in routes:
            routes[route_key] = {
                'origin': s.pickup_city or 'Unknown',
                'destination': s.delivery_city or 'Unknown',
                'count': 0,
                'delivery_times': []
            }
        routes[route_key]['count'] += 1
        if s.status == ShipmentStatus.CONFIRMED and s.delivered_at and s.created_at:
            hours = (s.delivered_at - s.created_at).total_seconds() / 3600
            routes[route_key]['delivery_times'].append(hours)
    
    top_routes = sorted([
        {
            'origin': r['origin'],
            'destination': r['destination'],
            'count': r['count'],
            'avgTime': sum(r['delivery_times']) / len(r['delivery_times']) if r['delivery_times'] else 0
        }
        for r in routes.values()
    ], key=lambda x: x['count'], reverse=True)[:5]
    
    # Courier performance (would need a Courier model in production)
    # For now, return placeholder data
    courier_performance = [
        {'name': 'Primary Courier', 'deliveries': len(delivered), 'rating': 4.5, 'onTime': on_time_rate}
    ]
    
    # Weekly comparison
    weekly_comparison = []
    for week in range(4):
        week_start = end_date - timedelta(weeks=week+1)
        week_end = end_date - timedelta(weeks=week)
        prev_week_start = week_start - timedelta(days=days)
        prev_week_end = week_end - timedelta(days=days)
        
        current_count = len([s for s in shipments if week_start <= s.created_at < week_end])
        previous_count = len([s for s in prev_shipments if prev_week_start <= s.created_at < prev_week_end])
        
        weekly_comparison.append({
            'week': f'Week {4 - week}',
            'current': current_count,
            'previous': previous_count
        })
    weekly_comparison.reverse()
    
    # Delivery time distribution
    time_ranges = [
        ('0-12h', 0, 12),
        ('12-24h', 12, 24),
        ('24-48h', 24, 48),
        ('48-72h', 48, 72),
        ('72h+', 72, float('inf'))
    ]
    
    delivery_time_distribution = []
    for label, min_hours, max_hours in time_ranges:
        count = len([t for t in delivery_times if min_hours <= t < max_hours])
        delivery_time_distribution.append({'range': label, 'count': count})
    
    return jsonify({
        'summary': {
            'totalShipments': total_shipments,
            'activeShipments': len(in_transit) + len(pending),
            'deliveredShipments': len(delivered),
            'confirmedShipments': len(confirmed),
            'cancelledShipments': len(cancelled),
            'deliveryRate': delivery_rate,
            'avgDeliveryTime': avg_delivery_time,
            'onTimeDeliveryRate': on_time_rate,
            'totalRevenue': total_shipments * 25.0  # Placeholder
        },
        'trends': {
            'shipmentsChange': round(shipments_change, 1),
            'deliveryRateChange': round(delivery_rate_change, 1),
            'avgTimeChange': 0  # Would need historical data
        },
        'dailyData': daily_data,
        'statusBreakdown': status_breakdown,
        'topRoutes': top_routes,
        'courierPerformance': courier_performance,
        'weeklyComparison': weekly_comparison,
        'deliveryTimeDistribution': delivery_time_distribution
    }), 200
