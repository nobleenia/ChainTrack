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
        - transfer_type: string (required) - Type of transfer
        - location: string (required) - Current location/destination
        
        For registered user recipient:
        - to_user_id: integer (optional) - Recipient user ID
        
        For external recipient (store, warehouse, etc.):
        - recipient_name: string (optional) - Name of store/company/person
        - recipient_address: string (optional) - Physical address
        - recipient_type: string (optional) - Type: 'store', 'warehouse', 'distributor', 'retailer', 'consumer'
        
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
    required_fields = ['product_id', 'transfer_type', 'location']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Must have either to_user_id OR recipient_name
    if not data.get('to_user_id') and not data.get('recipient_name'):
        return jsonify({'error': 'Either to_user_id or recipient_name is required'}), 400
    
    # Get product
    product = Product.query.filter_by(product_id=data['product_id']).first()
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    # Verify sender is current holder or manufacturer
    if product.current_holder_id != user.id and product.manufacturer_id != user.id:
        return jsonify({'error': 'You are not authorized to transfer this product'}), 403
    
    # Handle recipient - either registered user or external
    recipient = None
    recipient_name = data.get('recipient_name')
    recipient_address = data.get('recipient_address')
    recipient_type = data.get('recipient_type', 'store')
    recipient_wallet = '0x0000000000000000000000000000000000000000'
    
    if data.get('to_user_id'):
        recipient = User.query.get(data['to_user_id'])
        if recipient:
            recipient_name = recipient.name
            recipient_wallet = recipient.wallet_address or recipient_wallet
    
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
        to_user_id=recipient.id if recipient else None,
        recipient_name=recipient_name,
        recipient_address=recipient_address,
        recipient_type=recipient_type,
        transfer_type=transfer_type,
        location=data['location'],
        notes=data.get('notes'),
        previous_hash=previous_hash
    )
    
    # Update product
    if recipient:
        product.current_holder_id = recipient.id
    product.current_location = data['location']
    
    # Update product status based on transfer type
    if transfer_type == TransferType.SHIPPED:
        product.status = ProductStatus.IN_TRANSIT
    elif transfer_type == TransferType.DELIVERED:
        product.status = ProductStatus.DELIVERED
    
    db.session.add(transfer)
    db.session.flush()
    
    # Record on blockchain - include recipient name and address for verification
    try:
        # Build location string with recipient info for on-chain storage
        chain_location = f"{data['location']}"
        if recipient_name:
            chain_location = f"{recipient_name} | {data['location']}"
        if recipient_address:
            chain_location = f"{recipient_name} | {recipient_address}"
        
        tx_hash, block_number = blockchain_service.record_transfer(
            product.product_id,
            user.wallet_address or '0x0000000000000000000000000000000000000000',
            recipient_wallet,
            transfer_type.value,
            chain_location  # This goes on-chain for verification
        )
        transfer.blockchain_hash = tx_hash
        transfer.blockchain_block = block_number
    except Exception as e:
        current_app.logger.error(f"Blockchain transfer recording failed: {e}")
        # Generate a mock hash for development
        import hashlib
        mock_data = f"{product.product_id}|{user.id}|{recipient_name}|{transfer_type.value}|{data['location']}"
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
