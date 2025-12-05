"""
Notification Model
In-app notifications for users
"""

from enum import Enum
from datetime import datetime

from .. import db


class NotificationType(Enum):
    """Types of notifications"""
    INFO = 'info'
    SUCCESS = 'success'
    WARNING = 'warning'
    ERROR = 'error'


class NotificationCategory(Enum):
    """Categories for notification grouping"""
    SYSTEM = 'system'           # System announcements, maintenance
    SHIPMENT = 'shipment'       # Shipment updates
    PRODUCT = 'product'         # Product registration, verification
    TRANSFER = 'transfer'       # Ownership transfers
    SECURITY = 'security'       # Login alerts, password changes
    REWARDS = 'rewards'         # Points earned, tier changes
    COURIER = 'courier'         # Courier assignments, updates


class Notification(db.Model):
    """In-app notification model"""
    
    __tablename__ = 'notifications'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id', ondelete='CASCADE'), nullable=False, index=True)
    
    # Notification content
    title = db.Column(db.String(200), nullable=False)
    message = db.Column(db.Text, nullable=False)
    
    # Classification
    type = db.Column(db.Enum(NotificationType), default=NotificationType.INFO, nullable=False)
    category = db.Column(db.Enum(NotificationCategory), default=NotificationCategory.SYSTEM, nullable=False)
    
    # Status
    is_read = db.Column(db.Boolean, default=False, nullable=False, index=True)
    
    # Optional: Link to related entity
    related_entity_type = db.Column(db.String(50), nullable=True)  # 'shipment', 'product', 'transfer', etc.
    related_entity_id = db.Column(db.String(100), nullable=True)   # ID of the related entity
    
    # Optional: Action URL for click-through
    action_url = db.Column(db.String(500), nullable=True)
    
    # Extra data (JSON for flexible additional data)
    extra_data = db.Column(db.JSON, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow, nullable=False, index=True)
    read_at = db.Column(db.DateTime, nullable=True)
    
    # Expiration (optional - for time-limited notifications)
    expires_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    user = db.relationship('User', backref=db.backref('notifications', lazy='dynamic', cascade='all, delete-orphan'))
    
    def __repr__(self):
        return f'<Notification {self.id}: {self.title[:30]}...>'
    
    def mark_as_read(self):
        """Mark notification as read"""
        if not self.is_read:
            self.is_read = True
            self.read_at = datetime.utcnow()
    
    def to_dict(self):
        """Serialize notification to dictionary"""
        return {
            'id': self.id,
            'title': self.title,
            'message': self.message,
            'type': self.type.value,
            'category': self.category.value,
            'is_read': self.is_read,
            'related_entity_type': self.related_entity_type,
            'related_entity_id': self.related_entity_id,
            'action_url': self.action_url,
            'extra_data': self.extra_data,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'read_at': self.read_at.isoformat() if self.read_at else None,
            'expires_at': self.expires_at.isoformat() if self.expires_at else None,
            # Computed fields for frontend compatibility
            'time': self._get_relative_time()
        }
    
    def _get_relative_time(self):
        """Get human-readable relative time"""
        if not self.created_at:
            return 'Unknown'
        
        now = datetime.utcnow()
        diff = now - self.created_at
        
        seconds = diff.total_seconds()
        
        if seconds < 60:
            return 'Just now'
        elif seconds < 3600:
            minutes = int(seconds / 60)
            return f'{minutes} minute{"s" if minutes != 1 else ""} ago'
        elif seconds < 86400:
            hours = int(seconds / 3600)
            return f'{hours} hour{"s" if hours != 1 else ""} ago'
        elif seconds < 604800:
            days = int(seconds / 86400)
            return f'{days} day{"s" if days != 1 else ""} ago'
        elif seconds < 2592000:
            weeks = int(seconds / 604800)
            return f'{weeks} week{"s" if weeks != 1 else ""} ago'
        else:
            return self.created_at.strftime('%b %d, %Y')
    
    @classmethod
    def create_notification(cls, user_id, title, message, notification_type=NotificationType.INFO,
                           category=NotificationCategory.SYSTEM, related_entity_type=None,
                           related_entity_id=None, action_url=None, extra_data=None, expires_at=None):
        """Factory method to create a notification"""
        notification = cls(
            user_id=user_id,
            title=title,
            message=message,
            type=notification_type,
            category=category,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
            action_url=action_url,
            extra_data=extra_data,
            expires_at=expires_at
        )
        db.session.add(notification)
        return notification
    
    @classmethod
    def get_unread_count(cls, user_id):
        """Get count of unread notifications for a user"""
        return cls.query.filter_by(user_id=user_id, is_read=False).count()
    
    @classmethod
    def get_user_notifications(cls, user_id, unread_only=False, category=None, 
                               limit=50, offset=0, include_expired=False):
        """Get notifications for a user with optional filters"""
        query = cls.query.filter_by(user_id=user_id)
        
        if unread_only:
            query = query.filter_by(is_read=False)
        
        if category:
            query = query.filter_by(category=category)
        
        if not include_expired:
            query = query.filter(
                (cls.expires_at == None) | (cls.expires_at > datetime.utcnow())
            )
        
        return query.order_by(cls.created_at.desc()).offset(offset).limit(limit).all()
    
    @classmethod
    def mark_all_as_read(cls, user_id):
        """Mark all notifications as read for a user"""
        now = datetime.utcnow()
        cls.query.filter_by(user_id=user_id, is_read=False).update({
            'is_read': True,
            'read_at': now
        })
        db.session.commit()
    
    @classmethod
    def delete_old_notifications(cls, days=30):
        """Delete notifications older than specified days"""
        cutoff = datetime.utcnow() - timedelta(days=days)
        cls.query.filter(cls.created_at < cutoff, cls.is_read == True).delete()
        db.session.commit()


# Missing import
from datetime import timedelta
