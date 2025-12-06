"""
ChainTrack Database Models
SQLAlchemy models for the supply chain platform
"""

from .user import User, UserRole
from .product import Product, ProductStatus
from .transfer import Transfer, TransferType, TransferStatus
from .rewards import (
    UserRewards, 
    PointTransaction, 
    Referral,
    RewardTier, 
    PointActionType,
    POINT_VALUES,
    TIER_THRESHOLDS,
    TIER_BENEFITS,
    POINTS_PER_TOKEN
)
from .shipment import (
    Shipment,
    ShipmentCheckpoint,
    DeliveryProof,
    ShipmentStatus,
    CheckpointAction,
    ShipmentTracking
)
from .courier import (
    CourierAuthorization,
    CheckpointChain
)
from .courier_profile import (
    CourierProfile,
    CourierSession,
    CourierActivity
)
from .notification import (
    Notification,
    NotificationType,
    NotificationCategory
)

__all__ = [
    'User',
    'UserRole',
    'Product',
    'ProductStatus',
    'Transfer',
    'TransferType',
    'TransferStatus',
    'UserRewards',
    'PointTransaction',
    'Referral',
    'RewardTier',
    'PointActionType',
    'POINT_VALUES',
    'TIER_THRESHOLDS',
    'TIER_BENEFITS',
    'POINTS_PER_TOKEN',
    'Shipment',
    'ShipmentCheckpoint',
    'DeliveryProof',
    'ShipmentStatus',
    'CheckpointAction',
    'ShipmentTracking',
    'CourierAuthorization',
    'CheckpointChain',
    'CourierProfile',
    'CourierSession',
    'CourierActivity',
    'Notification',
    'NotificationType',
    'NotificationCategory'
]
