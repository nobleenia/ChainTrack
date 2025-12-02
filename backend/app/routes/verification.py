"""
Verification Routes
Public product verification for consumers
Supports tiered access: basic for anonymous, full for registered users
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, verify_jwt_in_request
from datetime import datetime

from .. import db
from ..models import Product

bp = Blueprint('verification', __name__)


def get_optional_user_id():
    """Get user ID if authenticated, None otherwise"""
    try:
        verify_jwt_in_request(optional=True)
        identity = get_jwt_identity()
        return int(identity) if identity else None
    except:
        return None


@bp.route('/<product_id>', methods=['GET'])
def verify_product(product_id):
    """
    Verify a product's authenticity (public endpoint)
    
    Tiered access:
    - Anonymous users: Basic product info + authenticity status
    - Registered users: Full journey + rewards points
    
    This endpoint is called when a consumer scans a QR code
    """
    product = Product.query.filter_by(product_id=product_id).first()
    
    if not product:
        return jsonify({
            'verified': False,
            'error': 'Product not found',
            'message': 'This product ID is not registered in our system. It may be counterfeit.',
            'is_authenticated': False
        }), 404
    
    # Check if user is authenticated
    user_id = get_optional_user_id()
    is_authenticated = user_id is not None
    
    # Increment verification count
    product.increment_verification()
    db.session.commit()
    
    # Award points if authenticated
    points_earned = 0
    user_rewards = None
    if is_authenticated:
        try:
            from ..services.rewards_service import RewardsService
            points_earned, _ = RewardsService.award_verification_points(user_id, product_id)
            
            # Get updated rewards info
            user_rewards = RewardsService.get_or_create_user_rewards(user_id)
            
            # Check if this completes a referral
            from ..models import Referral
            referral = Referral.query.filter_by(referred_id=user_id, is_completed=False).first()
            if referral:
                RewardsService.complete_referral(referral.id)
        except Exception as e:
            # Don't fail verification if rewards fail
            print(f"Rewards error: {e}")
    
    # Build response based on authentication status
    if is_authenticated:
        # Full response for authenticated users
        response = {
            'verified': True,
            'is_authenticated': True,
            'access_level': 'full',
            'points_earned': points_earned,
            'rewards': {
                'points_earned': points_earned,
                'total_points': user_rewards.current_points if user_rewards else 0,
                'tier': user_rewards.tier.value if user_rewards else 'BRONZE'
            } if points_earned > 0 else None,
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
            'journey': product.get_journey(),  # Full journey for authenticated users
            'verification_stats': {
                'total_verifications': product.verification_count,
                'last_verified': product.last_verified_at.isoformat() if product.last_verified_at else None,
                'verified_at': datetime.utcnow().isoformat()
            }
        }
    else:
        # Limited response for anonymous users
        journey = product.get_journey()
        # Show only first and last journey event for anonymous
        limited_journey = []
        if journey:
            limited_journey.append(journey[0])  # Origin
            if len(journey) > 1:
                limited_journey.append({
                    'action': 'journey_hidden',
                    'message': f'{len(journey) - 2} events hidden. Sign up to see full journey!',
                    'events_count': len(journey) - 2
                })
                limited_journey.append(journey[-1])  # Current status
        
        response = {
            'verified': True,
            'is_authenticated': False,
            'access_level': 'basic',
            'product': {
                'product_id': product.product_id,
                'name': product.name,
                'description': product.description[:100] + '...' if product.description and len(product.description) > 100 else product.description,
                'category': product.category,
                'manufacturer': {
                    'name': product.manufacturer.name if product.manufacturer else 'Unknown',
                    'company': product.manufacturer.company_name if product.manufacturer else None
                },
                'status': product.status.value
            },
            'blockchain': {
                'registered': True,
                'verified': True,
                # Hide detailed blockchain info for anonymous
                'message': 'Sign up to see full blockchain details'
            },
            'journey': limited_journey,
            'verification_stats': {
                'total_verifications': product.verification_count,
                'verified_at': datetime.utcnow().isoformat()
            },
            'upgrade_prompt': {
                'message': 'Create a free account to unlock full features!',
                'benefits': [
                    'View complete product journey',
                    'Earn points for every verification',
                    'Convert points to CTK tokens',
                    'Access blockchain transaction details',
                    'Save verification history'
                ]
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
