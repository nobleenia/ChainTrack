"""
Transfer Routes
Product ownership transfers with proper acceptance workflow

Key concepts:
- Transfer ≠ Shipment: Transfer changes ownership, shipment tracks physical movement
- Pending transfers lock product from new transfers until accepted/rejected/cancelled
- External recipients get a claim token to claim ownership via link
- Registered users see incoming transfers in their dashboard
"""

from flask import Blueprint, request, jsonify, current_app, url_for
from flask_jwt_extended import jwt_required, get_jwt_identity

from .. import db
from ..models import User, Product, Transfer, TransferType, TransferStatus, ProductStatus
from ..services.blockchain_service import blockchain_service

bp = Blueprint('transfers', __name__)


@bp.route('', methods=['GET'])
@jwt_required()
def get_transfers():
    """
    Get transfers for the current user
    
    Query params:
        - direction: 'sent', 'received', 'pending', 'all' (default: all)
        - status: filter by transfer status
        - page, per_page: pagination
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    direction = request.args.get('direction', 'all')
    status_filter = request.args.get('status')
    
    # Build query based on direction
    if direction == 'sent':
        query = Transfer.query.filter_by(from_user_id=user.id)
    elif direction == 'received':
        query = Transfer.query.filter_by(to_user_id=user.id)
    elif direction == 'pending':
        # Pending transfers where user is the recipient
        query = Transfer.query.filter(
            Transfer.to_user_id == user.id,
            Transfer.status == TransferStatus.PENDING
        )
    else:
        query = Transfer.query.filter(
            db.or_(
                Transfer.from_user_id == user.id,
                Transfer.to_user_id == user.id
            )
        )
    
    # Filter by status if provided
    if status_filter:
        try:
            status = TransferStatus(status_filter)
            query = query.filter_by(status=status)
        except ValueError:
            pass  # Ignore invalid status
    
    pagination = query.order_by(Transfer.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    # Count pending incoming transfers
    pending_count = Transfer.query.filter(
        Transfer.to_user_id == user.id,
        Transfer.status == TransferStatus.PENDING
    ).count()
    
    return jsonify({
        'transfers': [t.to_dict() for t in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page,
        'pending_incoming': pending_count
    }), 200


@bp.route('', methods=['POST'])
@jwt_required()
def create_transfer():
    """
    Initiate a new product transfer
    
    This creates a PENDING transfer. Ownership does NOT change until receiver accepts.
    Product becomes locked (cannot create another transfer until this one is resolved).
    
    Request Body:
        - product_id: string (required) - The product's unique ID
        - transfer_type: string (required) - Type of transfer
        - location: string (required) - Current location/destination
        
        For registered user recipient:
        - to_user_id: integer (optional) - Recipient user ID
        
        For external recipient:
        - recipient_name: string (optional) - Name of store/company/person
        - recipient_address: string (optional) - Physical address
        - recipient_type: string (optional) - 'store', 'warehouse', 'distributor', 'retailer', 'consumer'
        - recipient_email: string (optional) - Email for sending claim link
        - recipient_phone: string (optional) - Phone for SMS claim link
        
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
    
    # Check if product already has a pending transfer
    if product.pending_transfer_id:
        existing_transfer = Transfer.query.get(product.pending_transfer_id)
        if existing_transfer and existing_transfer.status == TransferStatus.PENDING:
            return jsonify({
                'error': 'This product already has a pending transfer. Cancel it or wait for it to be resolved.',
                'pending_transfer_id': product.pending_transfer_id
            }), 409
    
    # Handle recipient - either registered user or external
    recipient = None
    recipient_name = data.get('recipient_name')
    recipient_address = data.get('recipient_address')
    recipient_type = data.get('recipient_type', 'store')
    recipient_email = data.get('recipient_email')
    recipient_phone = data.get('recipient_phone')
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
    
    # Create transfer with PENDING status
    transfer = Transfer(
        product_id=product.id,
        from_user_id=user.id,
        to_user_id=recipient.id if recipient else None,
        recipient_name=recipient_name,
        recipient_address=recipient_address,
        recipient_type=recipient_type,
        recipient_email=recipient_email,
        recipient_phone=recipient_phone,
        transfer_type=transfer_type,
        location=data['location'],
        notes=data.get('notes'),
        previous_hash=previous_hash,
        status=TransferStatus.PENDING  # Explicitly set as pending
    )
    
    # Generate claim token for external recipients (no registered user)
    claim_url = None
    if not recipient:
        transfer.generate_claim_token()
        # Build claim URL (will be sent via email/SMS)
        base_url = current_app.config.get('FRONTEND_URL', 'http://localhost:5173')
        claim_url = f"{base_url}/claim-transfer/{transfer.claim_token}"
    
    db.session.add(transfer)
    db.session.flush()  # Get the transfer ID
    
    # Lock the product - set pending_transfer_id
    product.pending_transfer_id = transfer.id
    product.status = ProductStatus.PENDING_TRANSFER
    # DO NOT change current_holder_id yet - that happens on acceptance
    
    # Record on blockchain
    try:
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
            chain_location
        )
        transfer.blockchain_hash = tx_hash
        transfer.blockchain_block = block_number
    except Exception as e:
        current_app.logger.error(f"Blockchain transfer recording failed: {e}")
        import hashlib
        mock_data = f"{product.product_id}|{user.id}|{recipient_name}|{transfer_type.value}|{data['location']}"
        transfer.blockchain_hash = f"0x{hashlib.sha256(mock_data.encode()).hexdigest()[:64]}"
    
    db.session.commit()
    
    # Send notifications
    try:
        from ..services.in_app_notification_service import in_app_notification_service
        
        # Notify sender
        in_app_notification_service.notify(
            user.id,
            'transfer_initiated',
            context={'product_name': product.name, 'recipient': recipient_name},
            related_entity_type='transfer',
            related_entity_id=str(transfer.id)
        )
        
        # Notify recipient if registered user
        if recipient:
            in_app_notification_service.notify(
                recipient.id,
                'transfer_pending_acceptance',
                context={
                    'product_name': product.name, 
                    'sender': user.name,
                    'transfer_id': transfer.id
                },
                related_entity_type='transfer',
                related_entity_id=str(transfer.id)
            )
        
        # TODO: Send email/SMS to external recipient with claim link
        if claim_url and (recipient_email or recipient_phone):
            current_app.logger.info(f"Should send claim link to {recipient_email or recipient_phone}: {claim_url}")
    except Exception as e:
        current_app.logger.error(f"Notification failed: {e}")
    
    response_data = {
        'message': 'Transfer initiated successfully. Awaiting recipient acceptance.',
        'transfer': transfer.to_dict()
    }
    
    # Include claim URL in response for manual sharing
    if claim_url:
        response_data['claim_url'] = claim_url
        response_data['claim_token'] = transfer.claim_token
    
    return jsonify(response_data), 201


@bp.route('/<int:transfer_id>/accept', methods=['POST'])
@jwt_required()
def accept_transfer(transfer_id):
    """
    Accept a pending transfer - this finalizes ownership change
    
    Request Body (optional):
        - confirm_irreversible: boolean - Must be true to confirm understanding
    """
    current_user_id = int(get_jwt_identity())
    
    transfer = Transfer.query.get(transfer_id)
    if not transfer:
        return jsonify({'error': 'Transfer not found'}), 404
    
    # Verify this user is the intended recipient
    if transfer.to_user_id != current_user_id:
        return jsonify({'error': 'Only the intended recipient can accept this transfer'}), 403
    
    if transfer.status != TransferStatus.PENDING:
        return jsonify({
            'error': f'This transfer is no longer pending. Current status: {transfer.status.value}'
        }), 400
    
    data = request.get_json() or {}
    
    # Require explicit confirmation
    if not data.get('confirm_irreversible'):
        return jsonify({
            'error': 'You must confirm that you understand this transfer is irreversible',
            'requires_confirmation': True,
            'message': 'By accepting this transfer, you become the legal owner of this product. This action cannot be undone.'
        }), 400
    
    # Accept the transfer - this changes ownership
    transfer.accept(current_user_id)
    db.session.commit()
    
    # Send notifications
    try:
        from ..services.in_app_notification_service import in_app_notification_service
        product = Product.query.get(transfer.product_id)
        product_name = product.name if product else 'Unknown Product'
        
        # Notify sender
        if transfer.from_user_id:
            in_app_notification_service.notify(
                transfer.from_user_id,
                'transfer_accepted',
                context={
                    'product_name': product_name,
                    'recipient': transfer.recipient_name
                },
                related_entity_type='transfer',
                related_entity_id=str(transfer.id)
            )
        
        # Notify new owner
        in_app_notification_service.notify(
            current_user_id,
            'transfer_completed',
            context={'product_name': product_name},
            related_entity_type='transfer',
            related_entity_id=str(transfer.id)
        )
    except Exception as e:
        current_app.logger.error(f"Notification failed: {e}")
    
    return jsonify({
        'message': 'Transfer accepted. You are now the owner of this product.',
        'transfer': transfer.to_dict()
    }), 200


@bp.route('/<int:transfer_id>/reject', methods=['POST'])
@jwt_required()
def reject_transfer(transfer_id):
    """
    Reject a pending transfer - product stays with original owner
    
    Request Body (optional):
        - reason: string - Reason for rejection
    """
    current_user_id = int(get_jwt_identity())
    
    transfer = Transfer.query.get(transfer_id)
    if not transfer:
        return jsonify({'error': 'Transfer not found'}), 404
    
    # Verify this user is the intended recipient
    if transfer.to_user_id != current_user_id:
        return jsonify({'error': 'Only the intended recipient can reject this transfer'}), 403
    
    if transfer.status != TransferStatus.PENDING:
        return jsonify({
            'error': f'This transfer is no longer pending. Current status: {transfer.status.value}'
        }), 400
    
    data = request.get_json() or {}
    reason = data.get('reason')
    
    # Reject the transfer
    transfer.reject(reason)
    db.session.commit()
    
    # Send notification to sender
    try:
        from ..services.in_app_notification_service import in_app_notification_service
        product = Product.query.get(transfer.product_id)
        product_name = product.name if product else 'Unknown Product'
        
        if transfer.from_user_id:
            in_app_notification_service.notify(
                transfer.from_user_id,
                'transfer_rejected',
                context={
                    'product_name': product_name,
                    'recipient': transfer.recipient_name,
                    'reason': reason or 'No reason provided'
                },
                related_entity_type='transfer',
                related_entity_id=str(transfer.id)
            )
    except Exception as e:
        current_app.logger.error(f"Notification failed: {e}")
    
    return jsonify({
        'message': 'Transfer rejected. The product remains with the original owner.',
        'transfer': transfer.to_dict()
    }), 200


@bp.route('/<int:transfer_id>/cancel', methods=['POST'])
@jwt_required()
def cancel_transfer(transfer_id):
    """
    Cancel a pending transfer (by the sender)
    
    Request Body (optional):
        - reason: string - Reason for cancellation
    """
    current_user_id = int(get_jwt_identity())
    
    transfer = Transfer.query.get(transfer_id)
    if not transfer:
        return jsonify({'error': 'Transfer not found'}), 404
    
    # Verify this user is the sender
    if transfer.from_user_id != current_user_id:
        return jsonify({'error': 'Only the sender can cancel this transfer'}), 403
    
    if transfer.status != TransferStatus.PENDING:
        return jsonify({
            'error': f'This transfer is no longer pending. Current status: {transfer.status.value}'
        }), 400
    
    data = request.get_json() or {}
    reason = data.get('reason')
    
    # Cancel the transfer
    transfer.cancel(reason)
    db.session.commit()
    
    # Notify recipient if registered
    try:
        from ..services.in_app_notification_service import in_app_notification_service
        product = Product.query.get(transfer.product_id)
        product_name = product.name if product else 'Unknown Product'
        
        if transfer.to_user_id:
            in_app_notification_service.notify(
                transfer.to_user_id,
                'transfer_cancelled',
                context={
                    'product_name': product_name,
                    'sender': transfer.sender.name if transfer.sender else 'Unknown'
                },
                related_entity_type='transfer',
                related_entity_id=str(transfer.id)
            )
    except Exception as e:
        current_app.logger.error(f"Notification failed: {e}")
    
    return jsonify({
        'message': 'Transfer cancelled successfully.',
        'transfer': transfer.to_dict()
    }), 200


@bp.route('/claim/<claim_token>', methods=['GET'])
def get_claim_details(claim_token):
    """
    Get details of a transfer by claim token (public endpoint)
    Used for the claim transfer page
    """
    transfer = Transfer.query.filter_by(claim_token=claim_token).first()
    
    if not transfer:
        return jsonify({'error': 'Invalid or expired claim link'}), 404
    
    if not transfer.is_claim_token_valid():
        if transfer.status != TransferStatus.PENDING:
            return jsonify({
                'error': f'This transfer has already been {transfer.status.value}',
                'status': transfer.status.value
            }), 400
        return jsonify({'error': 'This claim link has expired'}), 400
    
    # Return limited info for the claim page
    product = Product.query.get(transfer.product_id)
    
    return jsonify({
        'transfer': {
            'id': transfer.id,
            'recipient_name': transfer.recipient_name,
            'location': transfer.location,
            'transfer_type': transfer.transfer_type.value,
            'notes': transfer.notes,
            'created_at': transfer.created_at.isoformat(),
            'sender': transfer.sender.name if transfer.sender else 'Unknown',
            'status': transfer.status.value
        },
        'product': {
            'product_id': product.product_id if product else None,
            'name': product.name if product else 'Unknown Product',
            'description': product.description if product else None,
            'category': product.category if product else None
        }
    }), 200


@bp.route('/claim/<claim_token>', methods=['POST'])
def claim_transfer(claim_token):
    """
    Claim a transfer using a claim token (public endpoint for external recipients)
    
    This allows unregistered recipients to either:
    1. Claim as guest (just confirms receipt)
    2. Create account and claim (becomes registered owner)
    
    Request Body:
        - confirm_irreversible: boolean (required) - Confirm understanding
        - create_account: boolean (optional) - Whether to create an account
        - email: string (required if create_account) - Email for new account
        - password: string (required if create_account) - Password for new account
        - name: string (optional) - Name to update on claim
    """
    transfer = Transfer.query.filter_by(claim_token=claim_token).first()
    
    if not transfer:
        return jsonify({'error': 'Invalid or expired claim link'}), 404
    
    if not transfer.is_claim_token_valid():
        if transfer.status != TransferStatus.PENDING:
            return jsonify({
                'error': f'This transfer has already been {transfer.status.value}',
                'status': transfer.status.value
            }), 400
        return jsonify({'error': 'This claim link has expired'}), 400
    
    data = request.get_json() or {}
    
    # Require explicit confirmation
    if not data.get('confirm_irreversible'):
        return jsonify({
            'error': 'You must confirm that you understand this is an ownership transfer',
            'requires_confirmation': True
        }), 400
    
    new_user = None
    
    # Option to create account while claiming
    if data.get('create_account'):
        email = data.get('email')
        password = data.get('password')
        name = data.get('name', transfer.recipient_name)
        
        if not email or not password:
            return jsonify({'error': 'Email and password required to create account'}), 400
        
        # Check if email already exists
        if User.query.filter_by(email=email).first():
            return jsonify({'error': 'An account with this email already exists. Please log in instead.'}), 400
        
        # Create user
        from ..models import UserRole
        new_user = User(
            email=email,
            name=name,
            role=UserRole.DISTRIBUTOR  # Default role for claimed accounts
        )
        new_user.set_password(password)
        new_user.ensure_user_id()  # Generate unique user_id
        db.session.add(new_user)
        db.session.flush()
        
        transfer.to_user_id = new_user.id
    
    # Accept the transfer
    transfer.accept(transfer.to_user_id)
    
    # Clear the claim token
    transfer.claim_token = None
    transfer.claim_token_expires_at = None
    
    db.session.commit()
    
    # Notify sender
    try:
        from ..services.in_app_notification_service import in_app_notification_service
        product = Product.query.get(transfer.product_id)
        
        if transfer.from_user_id:
            in_app_notification_service.notify(
                transfer.from_user_id,
                'transfer_claimed',
                context={
                    'product_name': product.name if product else 'Unknown',
                    'recipient': transfer.recipient_name
                },
                related_entity_type='transfer',
                related_entity_id=str(transfer.id)
            )
    except Exception as e:
        current_app.logger.error(f"Notification failed: {e}")
    
    response = {
        'message': 'Transfer claimed successfully. You are now the owner of this product.',
        'transfer': transfer.to_dict()
    }
    
    if new_user:
        # Generate JWT for new user
        from flask_jwt_extended import create_access_token, create_refresh_token
        access_token = create_access_token(identity=str(new_user.id))
        refresh_token = create_refresh_token(identity=str(new_user.id))
        response['user'] = new_user.to_dict()
        response['access_token'] = access_token
        response['refresh_token'] = refresh_token
        response['message'] = 'Account created and transfer claimed. Welcome to ChainTrack!'
    
    return jsonify(response), 200


@bp.route('/<int:transfer_id>/confirm', methods=['POST'])
@jwt_required()
def confirm_transfer(transfer_id):
    """
    Legacy endpoint - redirects to accept_transfer
    Kept for backwards compatibility
    """
    return accept_transfer(transfer_id)


@bp.route('/product/<product_id>', methods=['GET'])
@jwt_required()
def get_product_transfers(product_id):
    """Get all transfers for a specific product"""
    product = Product.query.filter_by(product_id=product_id).first()
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    transfers = product.transfers.order_by(Transfer.created_at.asc()).all()
    
    # Check for pending transfer
    pending_transfer = None
    if product.pending_transfer_id:
        pt = Transfer.query.get(product.pending_transfer_id)
        if pt and pt.status == TransferStatus.PENDING:
            pending_transfer = pt.to_dict()
    
    return jsonify({
        'product_id': product_id,
        'transfers': [t.to_dict() for t in transfers],
        'pending_transfer': pending_transfer,
        'has_pending_transfer': pending_transfer is not None
    }), 200
