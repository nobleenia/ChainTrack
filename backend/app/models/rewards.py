"""
Rewards Model
Points, tokens, and reward tiers for user engagement
"""

from enum import Enum
from datetime import datetime

from .. import db


class RewardTier(Enum):
    """User reward tiers based on points accumulated"""
    BRONZE = 'bronze'       # 0 - 999 points
    SILVER = 'silver'       # 1,000 - 4,999 points
    GOLD = 'gold'           # 5,000 - 19,999 points
    PLATINUM = 'platinum'   # 20,000 - 49,999 points
    DIAMOND = 'diamond'     # 50,000+ points


class PointActionType(Enum):
    """Types of actions that earn or spend points"""
    # Earning actions
    VERIFICATION = 'verification'           # Verify a product
    FIRST_VERIFICATION = 'first_verification'  # First time verifying
    DAILY_LOGIN = 'daily_login'             # Daily login bonus
    LOGIN_STREAK = 'login_streak'           # Consecutive daily logins
    REFERRAL = 'referral'                   # Refer a new user
    REPORT_COUNTERFEIT = 'report_counterfeit'  # Report fake product
    PROFILE_COMPLETE = 'profile_complete'   # Complete profile info
    REGISTER_PRODUCT = 'register_product'   # Manufacturer registers product
    TRANSFER_PRODUCT = 'transfer_product'   # Product transfer recorded
    
    # Spending/Conversion
    TOKEN_CONVERSION = 'token_conversion'   # Convert points to CTK tokens
    REDEEM_REWARD = 'redeem_reward'         # Redeem for other rewards


# Point values for each action
POINT_VALUES = {
    PointActionType.VERIFICATION: 10,
    PointActionType.FIRST_VERIFICATION: 50,
    PointActionType.DAILY_LOGIN: 5,
    PointActionType.LOGIN_STREAK: 2,  # Per day of streak
    PointActionType.REFERRAL: 200,
    PointActionType.REPORT_COUNTERFEIT: 100,
    PointActionType.PROFILE_COMPLETE: 25,
    PointActionType.REGISTER_PRODUCT: 15,
    PointActionType.TRANSFER_PRODUCT: 10,
}

# Tier thresholds
TIER_THRESHOLDS = {
    RewardTier.BRONZE: 0,
    RewardTier.SILVER: 1000,
    RewardTier.GOLD: 5000,
    RewardTier.PLATINUM: 20000,
    RewardTier.DIAMOND: 50000,
}

# Tier benefits (multipliers and perks)
TIER_BENEFITS = {
    RewardTier.BRONZE: {
        'point_multiplier': 1.0,
        'daily_bonus': 5,
        'description': 'Starting tier - Begin your verification journey'
    },
    RewardTier.SILVER: {
        'point_multiplier': 1.25,
        'daily_bonus': 10,
        'description': 'Active verifier - 25% bonus on all points'
    },
    RewardTier.GOLD: {
        'point_multiplier': 1.5,
        'daily_bonus': 15,
        'description': 'Trusted verifier - 50% bonus on all points'
    },
    RewardTier.PLATINUM: {
        'point_multiplier': 2.0,
        'daily_bonus': 25,
        'description': 'Expert verifier - Double points on all actions'
    },
    RewardTier.DIAMOND: {
        'point_multiplier': 2.5,
        'daily_bonus': 50,
        'description': 'Elite verifier - 2.5x points + exclusive rewards'
    },
}

# Token conversion rate
POINTS_PER_TOKEN = 1000  # 1000 points = 1 CTK token


class UserRewards(db.Model):
    """
    User rewards and points balance
    Tracks total points, tokens, and tier status
    """
    
    __tablename__ = 'user_rewards'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    
    # Points balance
    total_points_earned = db.Column(db.Integer, default=0)  # Lifetime points earned
    current_points = db.Column(db.Integer, default=0)       # Available points
    
    # Token balance
    ctk_tokens = db.Column(db.Float, default=0.0)           # CTK token balance
    tokens_converted = db.Column(db.Float, default=0.0)     # Total tokens ever converted
    
    # Tier
    tier = db.Column(db.Enum(RewardTier), default=RewardTier.BRONZE)
    
    # Streaks and stats
    current_login_streak = db.Column(db.Integer, default=0)
    longest_login_streak = db.Column(db.Integer, default=0)
    total_verifications = db.Column(db.Integer, default=0)
    total_referrals = db.Column(db.Integer, default=0)
    
    # Timestamps
    last_daily_claim = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('rewards', uselist=False))
    transactions = db.relationship('PointTransaction', backref='user_rewards', lazy='dynamic')
    
    def get_tier(self):
        """Calculate current tier based on total points earned"""
        for tier in reversed(list(RewardTier)):
            if self.total_points_earned >= TIER_THRESHOLDS[tier]:
                return tier
        return RewardTier.BRONZE
    
    def update_tier(self):
        """Update tier based on points"""
        self.tier = self.get_tier()
    
    def get_point_multiplier(self):
        """Get point multiplier for current tier"""
        return TIER_BENEFITS[self.tier]['point_multiplier']
    
    def get_next_tier_progress(self):
        """Get progress to next tier"""
        current_tier_index = list(RewardTier).index(self.tier)
        if current_tier_index >= len(RewardTier) - 1:
            return {'next_tier': None, 'points_needed': 0, 'progress': 100}
        
        next_tier = list(RewardTier)[current_tier_index + 1]
        current_threshold = TIER_THRESHOLDS[self.tier]
        next_threshold = TIER_THRESHOLDS[next_tier]
        points_in_tier = self.total_points_earned - current_threshold
        points_needed = next_threshold - current_threshold
        progress = min(100, (points_in_tier / points_needed) * 100)
        
        return {
            'next_tier': next_tier.value,
            'points_needed': next_threshold - self.total_points_earned,
            'progress': round(progress, 1)
        }
    
    def add_points(self, points, multiplied=True):
        """Add points with optional tier multiplier"""
        if multiplied:
            points = int(points * self.get_point_multiplier())
        self.current_points += points
        self.total_points_earned += points
        self.update_tier()
        return points
    
    def convert_to_tokens(self, points_to_convert=None):
        """Convert points to CTK tokens"""
        if points_to_convert is None:
            points_to_convert = self.current_points
        
        if points_to_convert > self.current_points:
            raise ValueError("Insufficient points")
        
        tokens = points_to_convert / POINTS_PER_TOKEN
        self.current_points -= points_to_convert
        self.ctk_tokens += tokens
        self.tokens_converted += tokens
        
        return tokens
    
    def to_dict(self):
        """Serialize to dictionary"""
        tier_progress = self.get_next_tier_progress()
        return {
            'user_id': self.user_id,
            'current_points': self.current_points,
            'total_points_earned': self.total_points_earned,
            'ctk_tokens': round(self.ctk_tokens, 4),
            'tier': self.tier.value,
            'tier_benefits': TIER_BENEFITS[self.tier],
            'next_tier_progress': tier_progress,
            'stats': {
                'total_verifications': self.total_verifications,
                'total_referrals': self.total_referrals,
                'current_login_streak': self.current_login_streak,
                'longest_login_streak': self.longest_login_streak
            },
            'conversion_rate': f'{POINTS_PER_TOKEN} points = 1 CTK',
            'last_daily_claim': self.last_daily_claim.isoformat() if self.last_daily_claim else None
        }


class PointTransaction(db.Model):
    """
    Individual point transaction record
    Tracks all point earnings and spending
    """
    
    __tablename__ = 'point_transactions'
    
    id = db.Column(db.Integer, primary_key=True)
    user_rewards_id = db.Column(db.Integer, db.ForeignKey('user_rewards.id'), nullable=False)
    
    # Transaction details
    action_type = db.Column(db.Enum(PointActionType), nullable=False)
    points = db.Column(db.Integer, nullable=False)  # Positive for earn, negative for spend
    multiplier_applied = db.Column(db.Float, default=1.0)
    
    # Reference to related entity (optional)
    reference_type = db.Column(db.String(50), nullable=True)  # 'product', 'transfer', 'referral', etc.
    reference_id = db.Column(db.String(100), nullable=True)
    
    # Metadata
    description = db.Column(db.String(255), nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def to_dict(self):
        """Serialize to dictionary"""
        return {
            'id': self.id,
            'action_type': self.action_type.value,
            'points': self.points,
            'multiplier_applied': self.multiplier_applied,
            'description': self.description,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }


class Referral(db.Model):
    """
    Referral tracking for user signups
    """
    
    __tablename__ = 'referrals'
    
    id = db.Column(db.Integer, primary_key=True)
    referrer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    referred_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    referral_code = db.Column(db.String(20), nullable=False)
    
    # Status
    is_completed = db.Column(db.Boolean, default=False)  # True when referred user verifies
    points_awarded = db.Column(db.Boolean, default=False)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    completed_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    referrer = db.relationship('User', foreign_keys=[referrer_id], backref='referrals_made')
    referred = db.relationship('User', foreign_keys=[referred_id], backref='referred_by')
    
    def to_dict(self):
        return {
            'id': self.id,
            'referrer_id': self.referrer_id,
            'referred_id': self.referred_id,
            'is_completed': self.is_completed,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
