"""
Rewards Routes
API endpoints for points, tokens, and rewards management
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity, jwt_required

from .. import db
from ..models import UserRewards, POINTS_PER_TOKEN, TIER_BENEFITS, RewardTier
from ..services.rewards_service import RewardsService

bp = Blueprint('rewards', __name__)


@bp.route('/balance', methods=['GET'])
@jwt_required()
def get_rewards_balance():
    """Get current user's rewards balance and stats"""
    current_user_id = int(get_jwt_identity())
    
    rewards = RewardsService.get_or_create_user_rewards(current_user_id)
    
    return jsonify({
        'rewards': rewards.to_dict()
    }), 200


@bp.route('/daily-bonus', methods=['POST'])
@jwt_required()
def claim_daily_bonus():
    """Claim daily login bonus"""
    current_user_id = int(get_jwt_identity())
    
    result = RewardsService.claim_daily_bonus(current_user_id)
    
    if result is None:
        return jsonify({
            'error': 'Daily bonus already claimed today',
            'message': 'Come back tomorrow for your next bonus!'
        }), 400
    
    points, transaction = result
    rewards = RewardsService.get_or_create_user_rewards(current_user_id)
    
    return jsonify({
        'message': 'Daily bonus claimed!',
        'points_earned': points,
        'current_streak': rewards.current_login_streak,
        'rewards': rewards.to_dict()
    }), 200


@bp.route('/convert', methods=['POST'])
@jwt_required()
def convert_to_tokens():
    """Convert points to CTK tokens"""
    current_user_id = int(get_jwt_identity())
    data = request.get_json() or {}
    
    points_to_convert = data.get('points')
    
    try:
        result = RewardsService.convert_points_to_tokens(current_user_id, points_to_convert)
        return jsonify({
            'message': 'Points converted successfully!',
            **result
        }), 200
    except ValueError as e:
        return jsonify({'error': str(e)}), 400


@bp.route('/history', methods=['GET'])
@jwt_required()
def get_transaction_history():
    """Get point transaction history"""
    current_user_id = int(get_jwt_identity())
    limit = request.args.get('limit', 50, type=int)
    
    transactions = RewardsService.get_transaction_history(current_user_id, limit)
    
    return jsonify({
        'transactions': transactions,
        'count': len(transactions)
    }), 200


@bp.route('/referral-code', methods=['GET'])
@jwt_required()
def get_referral_code():
    """Get user's referral code"""
    current_user_id = int(get_jwt_identity())
    
    code = RewardsService.generate_referral_code(current_user_id)
    
    return jsonify({
        'referral_code': code,
        'referral_link': f'https://chaintrack.io/register?ref={code}',
        'reward': f'{TIER_BENEFITS[RewardTier.BRONZE]["point_multiplier"] * 200} points when friend verifies first product'
    }), 200


@bp.route('/leaderboard', methods=['GET'])
def get_leaderboard():
    """Get top users leaderboard (public)"""
    limit = request.args.get('limit', 10, type=int)
    limit = min(limit, 100)  # Cap at 100
    
    leaderboard = RewardsService.get_leaderboard(limit)
    
    return jsonify({
        'leaderboard': leaderboard
    }), 200


@bp.route('/tiers', methods=['GET'])
def get_tiers_info():
    """Get information about all reward tiers (public)"""
    tiers = []
    for tier in RewardTier:
        from ..models import TIER_THRESHOLDS
        tiers.append({
            'name': tier.value,
            'threshold': TIER_THRESHOLDS[tier],
            'benefits': TIER_BENEFITS[tier]
        })
    
    return jsonify({
        'tiers': tiers,
        'conversion_rate': f'{POINTS_PER_TOKEN} points = 1 CTK token'
    }), 200


@bp.route('/stats', methods=['GET'])
@jwt_required()
def get_rewards_stats():
    """Get detailed rewards statistics"""
    current_user_id = int(get_jwt_identity())
    
    rewards = RewardsService.get_or_create_user_rewards(current_user_id)
    
    # Calculate some additional stats
    from ..models import PointTransaction, PointActionType
    
    # Points earned this week
    from datetime import datetime, timedelta
    week_ago = datetime.utcnow() - timedelta(days=7)
    week_transactions = PointTransaction.query.filter(
        PointTransaction.user_rewards_id == rewards.id,
        PointTransaction.created_at >= week_ago,
        PointTransaction.points > 0
    ).all()
    points_this_week = sum(t.points for t in week_transactions)
    
    # Verifications this week
    verifications_this_week = sum(
        1 for t in week_transactions 
        if t.action_type in [PointActionType.VERIFICATION, PointActionType.FIRST_VERIFICATION]
    )
    
    return jsonify({
        'rewards': rewards.to_dict(),
        'weekly_stats': {
            'points_earned': points_this_week,
            'verifications': verifications_this_week
        },
        'achievements': {
            'first_verification': rewards.total_verifications > 0,
            'streak_master': rewards.longest_login_streak >= 7,
            'referral_champion': rewards.total_referrals >= 5,
            'century_verifier': rewards.total_verifications >= 100
        }
    }), 200
