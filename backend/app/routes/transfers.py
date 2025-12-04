"""
Transfer Routes
Product custody transfers and tracking
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity

from .. import db
from ..models import User, Product, Transfer, TransferType, ProductStatus
from ..services.blockchain_service import blockchain_service

bp = Blueprint('transfers', __name__)


@bp.route('', methods=['GET'])
@jwt_required()
def get_transfers():
    """Get transfers for the current user"""
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    direction = request.args.get('direction', 'all')  # 'sent', 'received', 'all'
    
    # Build query based on direction
    if direction == 'sent':
        query = Transfer.query.filter_by(from_user_id=user.id)
    elif direction == 'received':
        query = Transfer.query.filter_by(to_user_id=user.id)
    else:
        query = Transfer.query.filter(
            db.or_(
                Transfer.from_user_id == user.id,
                Transfer.to_user_id == user.id
            )
        )
    
    pagination = query.order_by(Transfer.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'transfers': [t.to_dict() for t in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


@bp.route('', methods=['POST'])
@jwt_required()
def create_transfer():
    """
    Create a new product transfer
    
    Request Body:
        - product_id: string (required) - The product's unique ID
        - to_user_id: integer (required) - Recipient user ID
        - transfer_type: string (required) - Type of transfer
        - location: string (required) - Current location
        - notes: string (optional) - Additional notes
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if not user.can_transfer_products():
        return jsonify({'error': 'Not authorized to transfer products'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['product_id', 'to_user_id', 'transfer_type', 'location']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Get product
    product = Product.query.filter_by(product_id=data['product_id']).first()
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    # Verify sender is current holder
    if product.current_holder_id != user.id:
        return jsonify({'error': 'You are not the current holder of this product'}), 403
    
    # Verify recipient exists
    recipient = User.query.get(data['to_user_id'])
    if not recipient:
        return jsonify({'error': 'Recipient not found'}), 404
    
    # Validate transfer type
    try:
        transfer_type = TransferType(data['transfer_type'])
    except ValueError:
        return jsonify({
            'error': f'Invalid transfer type. Must be one of: {[t.value for t in TransferType]}'
        }), 400
    
    # Get previous transfer hash for chain integrity
    last_transfer = product.transfers.order_by(Transfer.created_at.desc()).first()
    previous_hash = last_transfer.blockchain_hash if last_transfer else product.blockchain_hash
    
    # Create transfer
    transfer = Transfer(
        product_id=product.id,
        from_user_id=user.id,
        to_user_id=recipient.id,
        transfer_type=transfer_type,
        location=data['location'],
        notes=data.get('notes'),
        previous_hash=previous_hash
    )
    
    # Update product
    product.current_holder_id = recipient.id
    product.current_location = data['location']
    
    # Update product status based on transfer type
    if transfer_type == TransferType.SHIPPED:
        product.status = ProductStatus.IN_TRANSIT
    elif transfer_type == TransferType.DELIVERED:
        product.status = ProductStatus.DELIVERED
    
    db.session.add(transfer)
    db.session.flush()
    
    # Record on blockchain
    try:
        tx_hash, block_number = blockchain_service.record_transfer(
            product.product_id,
            user.wallet_address or '0x0000000000000000000000000000000000000000',
            recipient.wallet_address or '0x0000000000000000000000000000000000000000',
            transfer_type.value,
            data['location']
        )
        transfer.blockchain_hash = tx_hash
        transfer.blockchain_block = block_number
    except Exception as e:
        current_app.logger.error(f"Blockchain transfer recording failed: {e}")
        # Generate a mock hash for development
        import hashlib
        mock_data = f"{product.product_id}|{user.id}|{recipient.id}|{transfer_type.value}"
        transfer.blockchain_hash = f"0x{hashlib.sha256(mock_data.encode()).hexdigest()[:64]}"
    
    db.session.commit()
    
    return jsonify({
        'message': 'Transfer created successfully',
        'transfer': transfer.to_dict()
    }), 201


@bp.route('/<int:transfer_id>/confirm', methods=['POST'])
@jwt_required()
def confirm_transfer(transfer_id):
    """Confirm receipt of a transfer"""
    current_user_id = int(get_jwt_identity())
    
    transfer = Transfer.query.get(transfer_id)
    
    if not transfer:
        return jsonify({'error': 'Transfer not found'}), 404
    
    if transfer.to_user_id != current_user_id:
        return jsonify({'error': 'Only the recipient can confirm this transfer'}), 403
    
    if transfer.is_confirmed:
        return jsonify({'error': 'Transfer already confirmed'}), 400
    
    transfer.confirm()
    db.session.commit()
    
    return jsonify({
        'message': 'Transfer confirmed successfully',
        'transfer': transfer.to_dict()
    }), 200


@bp.route('/product/<product_id>', methods=['GET'])
@jwt_required()
def get_product_transfers(product_id):
    """Get all transfers for a specific product"""
    product = Product.query.filter_by(product_id=product_id).first()
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    transfers = product.transfers.order_by(Transfer.created_at.asc()).all()
    
    return jsonify({
        'product_id': product_id,
        'transfers': [t.to_dict() for t in transfers]
    }), 200
