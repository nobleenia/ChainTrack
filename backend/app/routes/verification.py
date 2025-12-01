"""
Verification Routes
Public product verification for consumers
"""

from flask import Blueprint, request, jsonify
from datetime import datetime

from .. import db
from ..models import Product

bp = Blueprint('verification', __name__)


@bp.route('/<product_id>', methods=['GET'])
def verify_product(product_id):
    """
    Verify a product's authenticity (public endpoint)
    
    This endpoint is called when a consumer scans a QR code
    No authentication required
    """
    product = Product.query.filter_by(product_id=product_id).first()
    
    if not product:
        return jsonify({
            'verified': False,
            'error': 'Product not found',
            'message': 'This product ID is not registered in our system. It may be counterfeit.'
        }), 404
    
    # Increment verification count
    product.increment_verification()
    db.session.commit()
    
    # Build verification response
    response = {
        'verified': True,
        'product': {
            'product_id': product.product_id,
            'name': product.name,
            'description': product.description,
            'category': product.category,
            'manufacturer': {
                'name': product.manufacturer.name if product.manufacturer else 'Unknown',
                'company': product.manufacturer.company_name if product.manufacturer else None
            },
            'production_date': product.production_date.isoformat() if product.production_date else None,
            'expiry_date': product.expiry_date.isoformat() if product.expiry_date else None,
            'manufacturing_location': product.manufacturing_location,
            'current_location': product.current_location,
            'status': product.status.value
        },
        'blockchain': {
            'registered': True,
            'transaction_hash': product.blockchain_hash,
            'block_number': product.blockchain_block,
            'network': 'Ethereum Sepolia'
        },
        'journey': product.get_journey(),
        'verification_stats': {
            'total_verifications': product.verification_count,
            'last_verified': product.last_verified_at.isoformat() if product.last_verified_at else None,
            'verified_at': datetime.utcnow().isoformat()
        }
    }
    
    return jsonify(response), 200


@bp.route('/check', methods=['POST'])
def check_product():
    """
    Check if a product exists (without incrementing verification count)
    
    Request Body:
        - product_id: string (required)
    """
    data = request.get_json()
    
    if not data or not data.get('product_id'):
        return jsonify({'error': 'product_id is required'}), 400
    
    product = Product.query.filter_by(product_id=data['product_id']).first()
    
    return jsonify({
        'exists': product is not None,
        'product_id': data['product_id']
    }), 200


@bp.route('/scan', methods=['POST'])
def record_scan():
    """
    Record a QR code scan event (for analytics)
    
    Request Body:
        - product_id: string (required)
        - location: object (optional) - {latitude, longitude}
        - user_agent: string (optional)
    """
    data = request.get_json()
    
    if not data or not data.get('product_id'):
        return jsonify({'error': 'product_id is required'}), 400
    
    product = Product.query.filter_by(product_id=data['product_id']).first()
    
    if not product:
        return jsonify({'error': 'Product not found'}), 404
    
    # In a full implementation, you would log this scan event
    # For now, just increment verification count
    product.increment_verification()
    db.session.commit()
    
    return jsonify({
        'message': 'Scan recorded',
        'product_id': product.product_id,
        'verification_count': product.verification_count
    }), 200


@bp.route('/batch', methods=['POST'])
def verify_batch():
    """
    Verify multiple products at once
    
    Request Body:
        - product_ids: array of strings (required)
    """
    data = request.get_json()
    
    if not data or not data.get('product_ids'):
        return jsonify({'error': 'product_ids array is required'}), 400
    
    product_ids = data['product_ids']
    
    if not isinstance(product_ids, list):
        return jsonify({'error': 'product_ids must be an array'}), 400
    
    if len(product_ids) > 100:
        return jsonify({'error': 'Maximum 100 products per batch'}), 400
    
    results = []
    for pid in product_ids:
        product = Product.query.filter_by(product_id=pid).first()
        results.append({
            'product_id': pid,
            'verified': product is not None,
            'name': product.name if product else None,
            'manufacturer': product.manufacturer.name if product and product.manufacturer else None
        })
    
    return jsonify({
        'results': results,
        'total': len(results),
        'verified_count': sum(1 for r in results if r['verified'])
    }), 200
