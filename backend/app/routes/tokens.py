"""
Token Routes
API endpoints for CTK token operations
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..models import User, UserRewards
from ..services.token_service import token_service

bp = Blueprint('tokens', __name__)
bp.strict_slashes = False


@bp.route('/info', methods=['GET'])
def get_token_info():
    """
    Get general token information
    
    Public endpoint - no auth required
    """
    return jsonify(token_service.get_token_info()), 200


@bp.route('/balance/<wallet_address>', methods=['GET'])
def get_wallet_balance(wallet_address):
    """
    Get CTK token balance for a wallet address
    
    Public endpoint - no auth required
    """
    balance = token_service.get_token_balance(wallet_address)
    
    if balance is None:
        return jsonify({'error': 'Could not fetch balance'}), 500
    
    claimed_points = token_service.get_claimed_points(wallet_address)
    
    return jsonify({
        'wallet_address': wallet_address,
        'token_balance': balance,
        'claimed_points': claimed_points or 0
    }), 200


@bp.route('/claimable', methods=['GET'])
@jwt_required()
def get_claimable_tokens():
    """
    Get how many tokens the current user can claim
    """
    current_user_id = int(get_jwt_identity())
    
    user_rewards = UserRewards.query.filter_by(user_id=current_user_id).first()
    
    if not user_rewards:
        return jsonify({
            'total_points': 0,
            'claimed_points': 0,
            'available_points': 0,
            'claimable_points': 0,
            'claimable_tokens': 0,
            'points_per_token': token_service.points_per_token
        }), 200
    
    claimable_points, claimable_tokens = token_service.calculate_claimable_tokens(current_user_id)
    available_points = user_rewards.total_points - user_rewards.claimed_points
    
    return jsonify({
        'total_points': user_rewards.total_points,
        'claimed_points': user_rewards.claimed_points,
        'available_points': available_points,
        'claimable_points': claimable_points,
        'claimable_tokens': claimable_tokens,
        'points_per_token': token_service.points_per_token,
        'token_balance': user_rewards.token_balance
    }), 200


@bp.route('/claim', methods=['POST'])
@jwt_required()
def claim_tokens():
    """
    Claim CTK tokens by converting accumulated points
    
    Request Body:
        - wallet_address: string (required) - User's Ethereum wallet address
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data or not data.get('wallet_address'):
        return jsonify({'error': 'Wallet address is required'}), 400
    
    wallet_address = data['wallet_address']
    
    # Get current claimable amount for the response
    claimable_points, claimable_tokens = token_service.calculate_claimable_tokens(current_user_id)
    
    if claimable_tokens == 0:
        return jsonify({
            'error': f'Not enough points to claim. You need at least {token_service.points_per_token} points.',
            'available_points': claimable_points,
            'points_per_token': token_service.points_per_token
        }), 400
    
    # Attempt to claim
    success, message, tx_hash = token_service.claim_tokens(current_user_id, wallet_address)
    
    if not success:
        return jsonify({'error': message}), 400
    
    # Get updated rewards
    user_rewards = UserRewards.query.filter_by(user_id=current_user_id).first()
    
    return jsonify({
        'message': message,
        'transaction_hash': tx_hash,
        'tokens_claimed': claimable_tokens,
        'points_used': claimable_points,
        'remaining_points': user_rewards.total_points - user_rewards.claimed_points if user_rewards else 0,
        'total_tokens_claimed': user_rewards.token_balance if user_rewards else claimable_tokens,
        'etherscan_url': f"https://sepolia.etherscan.io/tx/{tx_hash}" if tx_hash else None
    }), 200


@bp.route('/save-wallet', methods=['POST'])
@jwt_required()
def save_wallet_address():
    """
    Save user's wallet address for future claims
    
    Request Body:
        - wallet_address: string (required) - User's Ethereum wallet address
    """
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data or not data.get('wallet_address'):
        return jsonify({'error': 'Wallet address is required'}), 400
    
    wallet_address = data['wallet_address']
    
    # Validate address format
    from web3 import Web3
    try:
        checksum_address = Web3.to_checksum_address(wallet_address)
    except Exception:
        return jsonify({'error': 'Invalid wallet address format'}), 400
    
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    user.wallet_address = checksum_address
    
    from .. import db
    db.session.commit()
    
    return jsonify({
        'message': 'Wallet address saved successfully',
        'wallet_address': checksum_address
    }), 200


@bp.route('/my-wallet', methods=['GET'])
@jwt_required()
def get_my_wallet():
    """
    Get current user's saved wallet address and token info
    """
    current_user_id = int(get_jwt_identity())
    
    user = User.query.get(current_user_id)
    if not user:
        return jsonify({'error': 'User not found'}), 404
    
    response = {
        'wallet_address': user.wallet_address,
        'has_wallet': bool(user.wallet_address)
    }
    
    # If user has a wallet, get their token balance
    if user.wallet_address:
        response['token_balance'] = token_service.get_token_balance(user.wallet_address)
        response['claimed_on_chain'] = token_service.get_claimed_points(user.wallet_address)
    
    return jsonify(response), 200
