"""
In-App Notification Service for ChainTrack
Service for creating and managing in-app notifications
"""

from typing import Optional, Dict, Any
from datetime import datetime, timedelta

from .. import db
from ..models import (
    Notification, 
    NotificationType, 
    NotificationCategory,
    User
)


class InAppNotificationService:
    """Service for managing in-app notifications"""
    
    # Pre-defined notification templates
    TEMPLATES = {
        # Account & Security
        'welcome': {
            'title': 'Welcome to ChainTrack!',
            'message': 'Your account has been created successfully. Start exploring the platform to track and verify your products.',
            'type': NotificationType.SUCCESS,
            'category': NotificationCategory.SYSTEM
        },
        'login_new_device': {
            'title': 'New Login Detected',
            'message': 'A new login was detected from {device} at {location}. If this wasn\'t you, please secure your account immediately.',
            'type': NotificationType.WARNING,
            'category': NotificationCategory.SECURITY
        },
        'password_changed': {
            'title': 'Password Changed',
            'message': 'Your password was successfully changed. If you didn\'t make this change, contact support immediately.',
            'type': NotificationType.INFO,
            'category': NotificationCategory.SECURITY
        },
        
        # Product Notifications
        'product_registered': {
            'title': 'Product Registered',
            'message': 'Product "{product_name}" (ID: {product_id}) has been registered on the blockchain.',
            'type': NotificationType.SUCCESS,
            'category': NotificationCategory.PRODUCT,
            'action_url': '/products/{product_id}'
        },
        'product_verified': {
            'title': 'Product Verified',
            'message': 'Product "{product_name}" has been verified as authentic.',
            'type': NotificationType.SUCCESS,
            'category': NotificationCategory.PRODUCT
        },
        'product_verification_failed': {
            'title': 'Verification Failed',
            'message': 'Warning: Product "{product_name}" failed verification. It may be counterfeit.',
            'type': NotificationType.ERROR,
            'category': NotificationCategory.PRODUCT
        },
        
        # Transfer Notifications
        'transfer_initiated': {
            'title': 'Transfer Initiated',
            'message': 'A transfer of "{product_name}" to {recipient} has been initiated. Awaiting acceptance.',
            'type': NotificationType.INFO,
            'category': NotificationCategory.TRANSFER,
            'action_url': '/transfers'
        },
        'transfer_pending_acceptance': {
            'title': 'Incoming Transfer',
            'message': '"{product_name}" is being transferred to you by {sender}. Please review and accept to claim ownership.',
            'type': NotificationType.WARNING,
            'category': NotificationCategory.TRANSFER,
            'action_url': '/transfers?tab=pending'
        },
        'transfer_received': {
            'title': 'Transfer Received',
            'message': 'You have received "{product_name}" from {sender}.',
            'type': NotificationType.SUCCESS,
            'category': NotificationCategory.TRANSFER,
            'action_url': '/transfers'
        },
        'transfer_completed': {
            'title': 'Transfer Completed',
            'message': 'Transfer of "{product_name}" has been completed and recorded on the blockchain.',
            'type': NotificationType.SUCCESS,
            'category': NotificationCategory.TRANSFER
        },
        'transfer_accepted': {
            'title': 'Transfer Accepted',
            'message': '{recipient} has accepted the transfer of "{product_name}". Ownership has been transferred.',
            'type': NotificationType.SUCCESS,
            'category': NotificationCategory.TRANSFER
        },
        'transfer_rejected': {
            'title': 'Transfer Rejected',
            'message': '{recipient} has declined the transfer of "{product_name}". Reason: {reason}',
            'type': NotificationType.WARNING,
            'category': NotificationCategory.TRANSFER,
            'action_url': '/transfers'
        },
        'transfer_cancelled': {
            'title': 'Transfer Cancelled',
            'message': '{sender} has cancelled the transfer of "{product_name}" to you.',
            'type': NotificationType.INFO,
            'category': NotificationCategory.TRANSFER
        },
        'transfer_claimed': {
            'title': 'Transfer Claimed',
            'message': '{recipient} has claimed the transfer of "{product_name}" via claim link.',
            'type': NotificationType.SUCCESS,
            'category': NotificationCategory.TRANSFER
        },
        'transfer_reminder': {
            'title': 'Pending Transfer Reminder',
            'message': 'Shipment of "{product_name}" has been delivered. Don\'t forget to initiate an ownership transfer if applicable.',
            'type': NotificationType.INFO,
            'category': NotificationCategory.TRANSFER,
            'action_url': '/products/{product_id}'
        },
        
        # Shipment Notifications
        'shipment_created': {
            'title': 'Shipment Created',
            'message': 'Shipment #{shipment_id} has been created and is pending pickup.',
            'type': NotificationType.SUCCESS,
            'category': NotificationCategory.SHIPMENT,
            'action_url': '/dashboard/shipments/{shipment_id}'
        },
        'shipment_picked_up': {
            'title': 'Shipment Picked Up',
            'message': 'Shipment #{shipment_id} has been picked up by the courier.',
            'type': NotificationType.INFO,
            'category': NotificationCategory.SHIPMENT
        },
        'shipment_in_transit': {
            'title': 'Shipment In Transit',
            'message': 'Shipment #{shipment_id} is now in transit to {destination}.',
            'type': NotificationType.INFO,
            'category': NotificationCategory.SHIPMENT
        },
        'shipment_delivered': {
            'title': 'Shipment Delivered',
            'message': 'Shipment #{shipment_id} has been delivered successfully.',
            'type': NotificationType.SUCCESS,
            'category': NotificationCategory.SHIPMENT
        },
        'shipment_delayed': {
            'title': 'Shipment Delayed',
            'message': 'Shipment #{shipment_id} is experiencing delays. Estimated new delivery: {new_date}.',
            'type': NotificationType.WARNING,
            'category': NotificationCategory.SHIPMENT
        },
        'shipment_exception': {
            'title': 'Shipment Exception',
            'message': 'There is an issue with shipment #{shipment_id}: {reason}',
            'type': NotificationType.ERROR,
            'category': NotificationCategory.SHIPMENT
        },
        
        # Courier Notifications
        'courier_assigned': {
            'title': 'Courier Assigned',
            'message': 'Courier {courier_name} has been assigned to shipment #{shipment_id}.',
            'type': NotificationType.INFO,
            'category': NotificationCategory.COURIER
        },
        'courier_authorization': {
            'title': 'Courier Authorization Request',
            'message': 'You have a new courier authorization request for shipment #{shipment_id}.',
            'type': NotificationType.INFO,
            'category': NotificationCategory.COURIER,
            'action_url': '/dashboard/shipments/{shipment_id}'
        },
        
        # Rewards Notifications
        'points_earned': {
            'title': 'Points Earned!',
            'message': 'You earned {points} points for {action}. Total: {total_points} points.',
            'type': NotificationType.SUCCESS,
            'category': NotificationCategory.REWARDS,
            'action_url': '/rewards'
        },
        'tier_upgraded': {
            'title': 'Tier Upgraded!',
            'message': 'Congratulations! You\'ve been upgraded to {tier} tier. Enjoy your new benefits!',
            'type': NotificationType.SUCCESS,
            'category': NotificationCategory.REWARDS
        },
        'referral_bonus': {
            'title': 'Referral Bonus!',
            'message': '{referred_user} joined using your referral. You earned {points} bonus points!',
            'type': NotificationType.SUCCESS,
            'category': NotificationCategory.REWARDS
        },
        
        # System Notifications
        'maintenance_scheduled': {
            'title': 'Scheduled Maintenance',
            'message': 'ChainTrack will undergo maintenance on {date} from {start_time} to {end_time}.',
            'type': NotificationType.WARNING,
            'category': NotificationCategory.SYSTEM
        },
        'feature_announcement': {
            'title': 'New Feature Available',
            'message': '{feature_name} is now available! {description}',
            'type': NotificationType.INFO,
            'category': NotificationCategory.SYSTEM
        }
    }
    
    def notify(self, user_id: int, template_name: str, context: Dict[str, Any] = None,
               action_url: str = None, related_entity_type: str = None,
               related_entity_id: str = None, extra_data: Dict = None) -> Optional[Notification]:
        """
        Create a notification from a template
        
        Args:
            user_id: Target user ID
            template_name: Name of the template to use
            context: Dictionary of values to format the template
            action_url: Override action URL from template
            related_entity_type: Type of related entity
            related_entity_id: ID of related entity
            extra_data: Additional data
        
        Returns:
            Created Notification or None if template not found
        """
        template = self.TEMPLATES.get(template_name)
        if not template:
            return None
        
        context = context or {}
        
        # Format title and message with context
        title = template['title'].format(**context) if context else template['title']
        message = template['message'].format(**context) if context else template['message']
        
        # Determine action URL
        final_action_url = action_url
        if not final_action_url and 'action_url' in template:
            final_action_url = template['action_url'].format(**context) if context else template['action_url']
        
        # Create notification
        notification = Notification.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=template['type'],
            category=template['category'],
            action_url=final_action_url,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
            extra_data=extra_data
        )
        
        db.session.commit()
        return notification
    
    def notify_custom(self, user_id: int, title: str, message: str,
                      notification_type: NotificationType = NotificationType.INFO,
                      category: NotificationCategory = NotificationCategory.SYSTEM,
                      action_url: str = None, related_entity_type: str = None,
                      related_entity_id: str = None, extra_data: Dict = None,
                      expires_at: datetime = None) -> Notification:
        """
        Create a custom notification (not from template)
        """
        notification = Notification.create_notification(
            user_id=user_id,
            title=title,
            message=message,
            notification_type=notification_type,
            category=category,
            action_url=action_url,
            related_entity_type=related_entity_type,
            related_entity_id=related_entity_id,
            extra_data=extra_data,
            expires_at=expires_at
        )
        
        db.session.commit()
        return notification
    
    def notify_multiple_users(self, user_ids: list, template_name: str,
                               context: Dict[str, Any] = None, **kwargs) -> list:
        """
        Send the same notification to multiple users
        """
        notifications = []
        for user_id in user_ids:
            notification = self.notify(user_id, template_name, context, **kwargs)
            if notification:
                notifications.append(notification)
        return notifications
    
    def notify_all_users(self, template_name: str, context: Dict[str, Any] = None,
                         role_filter: str = None, **kwargs) -> int:
        """
        Send notification to all users (optionally filtered by role)
        Returns count of notifications created
        """
        query = User.query.filter_by(is_active=True)
        if role_filter:
            from ..models import UserRole
            try:
                role = UserRole(role_filter)
                query = query.filter_by(role=role)
            except ValueError:
                pass
        
        users = query.all()
        count = 0
        
        for user in users:
            notification = self.notify(user.id, template_name, context, **kwargs)
            if notification:
                count += 1
        
        return count
    
    # Convenience methods for common notifications
    def welcome_user(self, user_id: int) -> Notification:
        """Send welcome notification to new user"""
        return self.notify(user_id, 'welcome')
    
    def product_registered(self, user_id: int, product_id: str, product_name: str) -> Notification:
        """Notify user their product was registered"""
        return self.notify(
            user_id,
            'product_registered',
            context={'product_id': product_id, 'product_name': product_name},
            related_entity_type='product',
            related_entity_id=product_id
        )
    
    def transfer_received(self, user_id: int, product_name: str, sender_name: str) -> Notification:
        """Notify user they received a product transfer"""
        return self.notify(
            user_id,
            'transfer_received',
            context={'product_name': product_name, 'sender': sender_name}
        )
    
    def shipment_status_update(self, user_id: int, shipment_id: str, status: str,
                                destination: str = None, reason: str = None) -> Notification:
        """Notify user of shipment status change"""
        template_map = {
            'created': 'shipment_created',
            'picked_up': 'shipment_picked_up',
            'in_transit': 'shipment_in_transit',
            'delivered': 'shipment_delivered',
            'delayed': 'shipment_delayed',
            'exception': 'shipment_exception'
        }
        
        template_name = template_map.get(status.lower(), 'shipment_in_transit')
        context = {
            'shipment_id': shipment_id,
            'destination': destination or 'destination',
            'reason': reason or 'Unknown issue'
        }
        
        return self.notify(
            user_id,
            template_name,
            context=context,
            related_entity_type='shipment',
            related_entity_id=shipment_id
        )
    
    def transfer_reminder(self, user_id: int, product_name: str, product_id: str) -> Notification:
        """Remind user to initiate transfer after shipment delivery"""
        return self.notify(
            user_id,
            'transfer_reminder',
            context={'product_name': product_name, 'product_id': product_id},
            related_entity_type='product',
            related_entity_id=product_id
        )
    
    def points_earned(self, user_id: int, points: int, action: str, total_points: int) -> Notification:
        """Notify user of points earned"""
        return self.notify(
            user_id,
            'points_earned',
            context={'points': points, 'action': action, 'total_points': total_points}
        )
    
    def tier_upgraded(self, user_id: int, tier: str) -> Notification:
        """Notify user of tier upgrade"""
        return self.notify(
            user_id,
            'tier_upgraded',
            context={'tier': tier}
        )


# Singleton instance
in_app_notification_service = InAppNotificationService()
