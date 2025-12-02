"""
Product Routes
Product registration, management, and retrieval
"""

from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity
from datetime import datetime

from .. import db
from ..models import User, Product, ProductStatus
from ..services.qr_service import generate_qr_code
from ..services.blockchain_service import BlockchainService

bp = Blueprint('products', __name__)


@bp.route('', methods=['GET'])
@jwt_required()
def get_products():
    """
    Get products based on user role
    - Manufacturers see their registered products
    - Distributors/Retailers see products in their custody
    - Admins see all products
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Query parameters
    page = request.args.get('page', 1, type=int)
    per_page = request.args.get('per_page', 20, type=int)
    status = request.args.get('status')
    search = request.args.get('search')
    category = request.args.get('category')
    
    # Base query based on role
    if user.role.value == 'admin':
        query = Product.query
    elif user.role.value == 'manufacturer':
        query = Product.query.filter_by(manufacturer_id=user.id)
    else:
        query = Product.query.filter_by(current_holder_id=user.id)
    
    # Apply filters
    if status:
        try:
            status_enum = ProductStatus(status)
            query = query.filter_by(status=status_enum)
        except ValueError:
            pass
    
    if category:
        query = query.filter(Product.category.ilike(f'%{category}%'))
    
    if search:
        query = query.filter(
            db.or_(
                Product.name.ilike(f'%{search}%'),
                Product.product_id.ilike(f'%{search}%')
            )
        )
    
    # Paginate
    pagination = query.order_by(Product.created_at.desc()).paginate(
        page=page, per_page=per_page, error_out=False
    )
    
    return jsonify({
        'products': [p.to_dict() for p in pagination.items],
        'total': pagination.total,
        'pages': pagination.pages,
        'current_page': page
    }), 200


@bp.route('/<product_id>', methods=['GET'])
@jwt_required()
def get_product(product_id):
    """Get a specific product by ID with full journey"""
    product = Product.query.filter_by(product_id=product_id).first()
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    return jsonify({
        'product': product.to_dict(include_journey=True)
    }), 200


@bp.route('', methods=['POST'])
@jwt_required()
def register_product():
    """
    Register a new product on the blockchain
    
    Request Body:
        - name: string (required)
        - description: string (optional)
        - category: string (optional)
        - production_date: string ISO date (required)
        - expiry_date: string ISO date (optional)
        - batch_number: string (optional)
        - manufacturing_location: string (required)
    """
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    if not user.can_register_products():
        return jsonify({'error': 'Only manufacturers can register products'}), 403
    
    data = request.get_json()
    
    # Validate required fields
    required_fields = ['name', 'production_date', 'manufacturing_location']
    for field in required_fields:
        if not data.get(field):
            return jsonify({'error': f'{field} is required'}), 400
    
    # Parse dates
    try:
        production_date = datetime.fromisoformat(data['production_date']).date()
        expiry_date = None
        if data.get('expiry_date'):
            expiry_date = datetime.fromisoformat(data['expiry_date']).date()
    except ValueError:
        return jsonify({'error': 'Invalid date format. Use ISO format (YYYY-MM-DD)'}), 400
    
    # Generate unique product ID
    product_id = Product.generate_product_id(data['name'], user.id)
    
    # Create product
    product = Product(
        product_id=product_id,
        name=data['name'],
        description=data.get('description'),
        category=data.get('category'),
        production_date=production_date,
        expiry_date=expiry_date,
        batch_number=data.get('batch_number'),
        manufacturing_location=data['manufacturing_location'],
        current_location=data['manufacturing_location'],
        manufacturer_id=user.id,
        current_holder_id=user.id,
        status=ProductStatus.REGISTERED
    )
    
    db.session.add(product)
    db.session.flush()  # Get the ID before committing
    
    # Generate QR code
    qr_url = f"{current_app.config['QR_CODE_BASE_URL']}/{product.product_id}"
    qr_code_path = generate_qr_code(product.product_id, qr_url)
    product.qr_code_url = qr_code_path
    
    # Register on blockchain (async in production)
    try:
        blockchain = BlockchainService()
        tx_hash, block_number = blockchain.register_product(
            product.product_id,
            product.generate_hash(),
            user.wallet_address or '0x0000000000000000000000000000000000000000'
        )
        product.blockchain_hash = tx_hash
        product.blockchain_block = block_number
    except Exception as e:
        current_app.logger.error(f"Blockchain registration failed: {e}")
        # Continue without blockchain registration in development
        product.blockchain_hash = f"0x{product.generate_hash()[:64]}"
    
    db.session.commit()
    
    return jsonify({
        'message': 'Product registered successfully',
        'product': product.to_dict()
    }), 201


@bp.route('/<product_id>', methods=['PUT'])
@jwt_required()
def update_product(product_id):
    """Update product details (limited fields)"""
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    product = Product.query.filter_by(product_id=product_id).first()
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    # Only manufacturer or admin can update
    if product.manufacturer_id != user.id and user.role.value != 'admin':
        return jsonify({'error': 'Not authorized to update this product'}), 403
    
    data = request.get_json()
    
    # Update allowed fields
    if 'description' in data:
        product.description = data['description']
    if 'category' in data:
        product.category = data['category']
    
    db.session.commit()
    
    return jsonify({
        'message': 'Product updated successfully',
        'product': product.to_dict()
    }), 200


@bp.route('/stats', methods=['GET'])
@jwt_required()
def get_product_stats():
    """Get product statistics for dashboard"""
    current_user_id = get_jwt_identity()
    user = User.query.get(int(current_user_id))
    
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    # Base query based on role
    if user.role.value == 'admin':
        base_query = Product.query
    elif user.role.value == 'manufacturer':
        base_query = Product.query.filter_by(manufacturer_id=user.id)
    else:
        base_query = Product.query.filter_by(current_holder_id=user.id)
    
    stats = {
        'total_products': base_query.count(),
        'registered': base_query.filter_by(status=ProductStatus.REGISTERED).count(),
        'in_transit': base_query.filter_by(status=ProductStatus.IN_TRANSIT).count(),
        'delivered': base_query.filter_by(status=ProductStatus.DELIVERED).count(),
        'verified': base_query.filter_by(status=ProductStatus.VERIFIED).count(),
        'total_verifications': db.session.query(
            db.func.sum(Product.verification_count)
        ).filter(base_query.whereclause).scalar() or 0
    }
    
    return jsonify({'stats': stats}), 200
