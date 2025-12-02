"""
Rewards Service
Handles all rewards-related business logic
"""

from datetime import datetime, timedelta
from typing import Optional, Tuple
import secrets

from .. import db
from ..models import (
    User, UserRewards, PointTransaction, Referral,
    PointActionType, POINT_VALUES, RewardTier
)


class RewardsService:
    """Service for managing user rewards, points, and tokens"""
    
    @staticmethod
    def get_or_create_user_rewards(user_id: int) -> UserRewards:
        """Get existing rewards record or create new one for user"""
        rewards = UserRewards.query.filter_by(user_id=user_id).first()
        if not rewards:
            rewards = UserRewards(user_id=user_id)
            db.session.add(rewards)
            db.session.commit()
        return rewards
    
    @staticmethod
    def award_points(
        user_id: int, 
        action_type: PointActionType,
        reference_type: str = None,
        reference_id: str = None,
        description: str = None,
        custom_points: int = None
    ) -> Tuple[int, PointTransaction]:
        """
        Award points to a user for an action
        Returns tuple of (points_awarded, transaction)
        """
        rewards = RewardsService.get_or_create_user_rewards(user_id)
        
        # Get base points for action
        base_points = custom_points if custom_points else POINT_VALUES.get(action_type, 0)
        
        # Apply tier multiplier
        multiplier = rewards.get_point_multiplier()
        final_points = int(base_points * multiplier)
        
        # Update rewards balance
        rewards.current_points += final_points
        rewards.total_points_earned += final_points
        rewards.update_tier()
        
        # Update action-specific stats
        if action_type == PointActionType.VERIFICATION:
            rewards.total_verifications += 1
        elif action_type == PointActionType.REFERRAL:
            rewards.total_referrals += 1
        
        # Create transaction record
        transaction = PointTransaction(
            user_rewards_id=rewards.id,
            action_type=action_type,
            points=final_points,
            multiplier_applied=multiplier,
            reference_type=reference_type,
            reference_id=reference_id,
            description=description or f"Earned {final_points} points for {action_type.value}"
        )
        db.session.add(transaction)
        db.session.commit()
        
        return final_points, transaction
    
    @staticmethod
    def claim_daily_bonus(user_id: int) -> Optional[Tuple[int, PointTransaction]]:
        """
        Claim daily login bonus if available
        Returns None if already claimed today
        """
        rewards = RewardsService.get_or_create_user_rewards(user_id)
        
        now = datetime.utcnow()
        today = now.date()
        
        # Check if already claimed today
        if rewards.last_daily_claim:
            last_claim_date = rewards.last_daily_claim.date()
            if last_claim_date == today:
                return None  # Already claimed
            
            # Check for streak
            yesterday = today - timedelta(days=1)
            if last_claim_date == yesterday:
                # Continue streak
                rewards.current_login_streak += 1
            else:
                # Streak broken
                rewards.current_login_streak = 1
        else:
            rewards.current_login_streak = 1
        
        # Update longest streak
        if rewards.current_login_streak > rewards.longest_login_streak:
            rewards.longest_login_streak = rewards.current_login_streak
        
        rewards.last_daily_claim = now
        
        # Award daily bonus points
        points, transaction = RewardsService.award_points(
            user_id,
            PointActionType.DAILY_LOGIN,
            description=f"Daily login bonus (Day {rewards.current_login_streak})"
        )
        
        # Award streak bonus if applicable
        if rewards.current_login_streak > 1:
            streak_bonus = rewards.current_login_streak * POINT_VALUES[PointActionType.LOGIN_STREAK]
            RewardsService.award_points(
                user_id,
                PointActionType.LOGIN_STREAK,
                custom_points=streak_bonus,
                description=f"Login streak bonus ({rewards.current_login_streak} days)"
            )
            points += streak_bonus
        
        db.session.commit()
        return points, transaction
    
    @staticmethod
    def award_verification_points(user_id: int, product_id: str) -> Tuple[int, PointTransaction]:
        """Award points for product verification"""
        rewards = RewardsService.get_or_create_user_rewards(user_id)
        
        # Check if first verification ever
        is_first = rewards.total_verifications == 0
        
        if is_first:
            # Award first verification bonus
            points, transaction = RewardsService.award_points(
                user_id,
                PointActionType.FIRST_VERIFICATION,
                reference_type='product',
                reference_id=product_id,
                description="First product verification bonus!"
            )
        else:
            # Regular verification points
            points, transaction = RewardsService.award_points(
                user_id,
                PointActionType.VERIFICATION,
                reference_type='product',
                reference_id=product_id,
                description=f"Verified product {product_id}"
            )
        
        return points, transaction
    
    @staticmethod
    def convert_points_to_tokens(user_id: int, points_to_convert: int = None) -> dict:
        """
        Convert points to CTK tokens
        Returns conversion details
        """
        rewards = RewardsService.get_or_create_user_rewards(user_id)
        
        if points_to_convert is None:
            points_to_convert = rewards.current_points
        
        if points_to_convert <= 0:
            raise ValueError("Must convert at least 1 point")
        
        if points_to_convert > rewards.current_points:
            raise ValueError(f"Insufficient points. Available: {rewards.current_points}")
        
        # Convert
        tokens = rewards.convert_to_tokens(points_to_convert)
        
        # Create transaction record
        transaction = PointTransaction(
            user_rewards_id=rewards.id,
            action_type=PointActionType.TOKEN_CONVERSION,
            points=-points_to_convert,
            multiplier_applied=1.0,
            description=f"Converted {points_to_convert} points to {tokens:.4f} CTK tokens"
        )
        db.session.add(transaction)
        db.session.commit()
        
        return {
            'points_converted': points_to_convert,
            'tokens_received': round(tokens, 4),
            'new_point_balance': rewards.current_points,
            'new_token_balance': round(rewards.ctk_tokens, 4)
        }
    
    @staticmethod
    def generate_referral_code(user_id: int) -> str:
        """Generate a unique referral code for a user"""
        user = User.query.get(user_id)
        if not user:
            raise ValueError("User not found")
        
        # Generate code based on user id and random string
        code = f"CTK{user_id}{secrets.token_hex(3).upper()}"
        return code
    
    @staticmethod
    def process_referral(referrer_code: str, new_user_id: int) -> Optional[Referral]:
        """
        Process a referral when new user signs up with a code
        Returns the referral record if successful
        """
        # Find the referrer (code format: CTK{user_id}{random})
        try:
            # Extract user_id from code (after "CTK", before the 6-char random part)
            code_part = referrer_code[3:-6]
            referrer_id = int(code_part)
        except (ValueError, IndexError):
            return None
        
        referrer = User.query.get(referrer_id)
        if not referrer or referrer.id == new_user_id:
            return None
        
        # Check if referral already exists
        existing = Referral.query.filter_by(referred_id=new_user_id).first()
        if existing:
            return None
        
        # Create referral record
        referral = Referral(
            referrer_id=referrer_id,
            referred_id=new_user_id,
            referral_code=referrer_code
        )
        db.session.add(referral)
        db.session.commit()
        
        return referral
    
    @staticmethod
    def complete_referral(referral_id: int) -> bool:
        """
        Complete a referral and award points to referrer
        Called when referred user completes first verification
        """
        referral = Referral.query.get(referral_id)
        if not referral or referral.is_completed:
            return False
        
        referral.is_completed = True
        referral.completed_at = datetime.utcnow()
        
        # Award points to referrer
        if not referral.points_awarded:
            RewardsService.award_points(
                referral.referrer_id,
                PointActionType.REFERRAL,
                reference_type='referral',
                reference_id=str(referral.referred_id),
                description=f"Referral completed: {referral.referred.name}"
            )
            referral.points_awarded = True
        
        db.session.commit()
        return True
    
    @staticmethod
    def get_leaderboard(limit: int = 10) -> list:
        """Get top users by total points earned"""
        top_rewards = UserRewards.query.order_by(
            UserRewards.total_points_earned.desc()
        ).limit(limit).all()
        
        return [
            {
                'rank': i + 1,
                'user_name': r.user.name if r.user else 'Unknown',
                'total_points': r.total_points_earned,
                'tier': r.tier.value,
                'verifications': r.total_verifications
            }
            for i, r in enumerate(top_rewards)
        ]
    
    @staticmethod
    def get_transaction_history(user_id: int, limit: int = 50) -> list:
        """Get point transaction history for a user"""
        rewards = UserRewards.query.filter_by(user_id=user_id).first()
        if not rewards:
            return []
        
        transactions = rewards.transactions.order_by(
            PointTransaction.created_at.desc()
        ).limit(limit).all()
        
        return [t.to_dict() for t in transactions]
