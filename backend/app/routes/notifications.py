"""
Notification Routes for ChainTrack
API endpoints for in-app notifications and notification preferences
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from .. import db
from ..models import Notification, NotificationType, NotificationCategory, User
from ..services.notification_service import notification_service

bp = Blueprint('notifications', __name__)


# ============================================
# In-App Notifications API
# ============================================

@bp.route('/', methods=['GET'])
@jwt_required()
def get_notifications():
    """
    Get user's notifications
    
    Query Parameters:
        - unread_only: boolean (default: false) - Only return unread notifications
        - category: string - Filter by category (system, shipment, product, transfer, security, rewards, courier)
        - limit: int (default: 50) - Number of notifications to return
        - offset: int (default: 0) - Pagination offset
    
    Returns:
        - notifications: List of notification objects
        - unread_count: Total unread count
        - total: Total notifications matching filters
    """
    user_id = get_jwt_identity()
    
    # Parse query parameters
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    category_str = request.args.get('category')
    limit = min(int(request.args.get('limit', 50)), 100)  # Max 100
    offset = int(request.args.get('offset', 0))
    
    # Parse category if provided
    category = None
    if category_str:
        try:
            category = NotificationCategory(category_str)
        except ValueError:
            return jsonify({'error': f'Invalid category: {category_str}'}), 400
    
    # Get notifications
    notifications = Notification.get_user_notifications(
        user_id=user_id,
        unread_only=unread_only,
        category=category,
        limit=limit,
        offset=offset
    )
    
    # Get counts
    unread_count = Notification.get_unread_count(user_id)
    
    # Get total for pagination
    query = Notification.query.filter_by(user_id=user_id)
    if unread_only:
        query = query.filter_by(is_read=False)
    if category:
        query = query.filter_by(category=category)
    total = query.count()
    
    return jsonify({
        'notifications': [n.to_dict() for n in notifications],
        'unread_count': unread_count,
        'total': total,
        'limit': limit,
        'offset': offset
    }), 200


@bp.route('/unread-count', methods=['GET'])
@jwt_required()
def get_unread_count():
    """Get just the unread notification count (lightweight endpoint for polling)"""
    user_id = get_jwt_identity()
    count = Notification.get_unread_count(user_id)
    return jsonify({'unread_count': count}), 200


@bp.route('/<int:notification_id>', methods=['GET'])
@jwt_required()
def get_notification(notification_id):
    """Get a single notification by ID"""
    user_id = get_jwt_identity()
    
    notification = Notification.query.filter_by(
        id=notification_id,
        user_id=user_id
    ).first()
    
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404
    
    return jsonify(notification.to_dict()), 200


@bp.route('/<int:notification_id>/read', methods=['POST'])
@jwt_required()
def mark_as_read(notification_id):
    """Mark a notification as read"""
    user_id = get_jwt_identity()
    
    notification = Notification.query.filter_by(
        id=notification_id,
        user_id=user_id
    ).first()
    
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404
    
    notification.mark_as_read()
    db.session.commit()
    
    return jsonify({
        'success': True,
        'notification': notification.to_dict()
    }), 200


@bp.route('/mark-all-read', methods=['POST'])
@jwt_required()
def mark_all_read():
    """Mark all notifications as read"""
    user_id = get_jwt_identity()
    
    Notification.mark_all_as_read(user_id)
    
    return jsonify({
        'success': True,
        'message': 'All notifications marked as read'
    }), 200


@bp.route('/<int:notification_id>', methods=['DELETE'])
@jwt_required()
def delete_notification(notification_id):
    """Delete a notification"""
    user_id = get_jwt_identity()
    
    notification = Notification.query.filter_by(
        id=notification_id,
        user_id=user_id
    ).first()
    
    if not notification:
        return jsonify({'error': 'Notification not found'}), 404
    
    db.session.delete(notification)
    db.session.commit()
    
    return jsonify({
        'success': True,
        'message': 'Notification deleted'
    }), 200


@bp.route('/clear-all', methods=['DELETE'])
@jwt_required()
def clear_all_notifications():
    """Delete all notifications for the user"""
    user_id = get_jwt_identity()
    
    # Optional: only delete read notifications
    read_only = request.args.get('read_only', 'false').lower() == 'true'
    
    query = Notification.query.filter_by(user_id=user_id)
    if read_only:
        query = query.filter_by(is_read=True)
    
    deleted_count = query.delete()
    db.session.commit()
    
    return jsonify({
        'success': True,
        'deleted_count': deleted_count
    }), 200


# ============================================
# Notification Creation (Internal/Admin API)
# ============================================

@bp.route('/send', methods=['POST'])
@jwt_required()
def send_notification():
    """
    Send a notification to a user (admin or system use)
    
    Request Body:
        - user_id: int - Target user ID (optional, defaults to current user for testing)
        - title: string - Notification title
        - message: string - Notification message
        - type: string - Notification type (info, success, warning, error)
        - category: string - Category (system, shipment, product, transfer, security, rewards, courier)
        - action_url: string - Optional URL for click-through
        - related_entity_type: string - Optional related entity type
        - related_entity_id: string - Optional related entity ID
    """
    current_user_id = get_jwt_identity()
    current_user = User.query.get(current_user_id)
    
    data = request.get_json()
    
    # Only admins can send to other users
    target_user_id = data.get('user_id', current_user_id)
    if target_user_id != current_user_id and current_user.role.value != 'admin':
        return jsonify({'error': 'Not authorized to send notifications to other users'}), 403
    
    # Validate required fields
    if not data.get('title') or not data.get('message'):
        return jsonify({'error': 'title and message are required'}), 400
    
    # Parse notification type
    try:
        notification_type = NotificationType(data.get('type', 'info'))
    except ValueError:
        return jsonify({'error': f'Invalid type: {data.get("type")}'}), 400
    
    # Parse category
    try:
        category = NotificationCategory(data.get('category', 'system'))
    except ValueError:
        return jsonify({'error': f'Invalid category: {data.get("category")}'}), 400
    
    # Create notification
    notification = Notification.create_notification(
        user_id=target_user_id,
        title=data['title'],
        message=data['message'],
        notification_type=notification_type,
        category=category,
        action_url=data.get('action_url'),
        related_entity_type=data.get('related_entity_type'),
        related_entity_id=data.get('related_entity_id'),
        extra_data=data.get('extra_data')
    )
    
    db.session.commit()
    
    return jsonify({
        'success': True,
        'notification': notification.to_dict()
    }), 201


# ============================================
# Email/SMS Notification Status (Existing)
# ============================================


@bp.route('/status', methods=['GET'])
def notification_status():
    """Check notification service status"""
    return jsonify({
        'email': {
            'configured': notification_service.is_email_configured,
            'provider': 'SendGrid'
        },
        'sms': {
            'configured': notification_service.is_sms_configured,
            'provider': 'Twilio'
        }
    }), 200


@bp.route('/test/email', methods=['POST'])
@jwt_required()
def test_email():
    """
    Send a test email notification
    
    Request Body:
        - email: Target email address
    """
    if not notification_service.is_email_configured:
        return jsonify({
            'error': 'Email service not configured',
            'message': 'Please configure SendGrid API key'
        }), 503
    
    data = request.get_json()
    email = data.get('email')
    
    if not email:
        return jsonify({'error': 'email is required'}), 400
    
    # Send test notification
    from ..services.notification_service import EmailProvider
    provider = EmailProvider()
    
    success, message = provider.send(
        to=email,
        subject='ChainTrack Test Notification',
        body='''Hello!

This is a test email from ChainTrack notification system.

If you received this, your email notifications are working correctly!

Best regards,
ChainTrack Team'''
    )
    
    if success:
        return jsonify({
            'success': True,
            'message': 'Test email sent successfully'
        }), 200
    else:
        return jsonify({
            'success': False,
            'error': message
        }), 500


@bp.route('/test/sms', methods=['POST'])
@jwt_required()
def test_sms():
    """
    Send a test SMS notification
    
    Request Body:
        - phone: Target phone number (with country code)
    """
    if not notification_service.is_sms_configured:
        return jsonify({
            'error': 'SMS service not configured',
            'message': 'Please configure Twilio credentials'
        }), 503
    
    data = request.get_json()
    phone = data.get('phone')
    
    if not phone:
        return jsonify({'error': 'phone is required'}), 400
    
    # Send test notification
    from ..services.notification_service import SMSProvider
    provider = SMSProvider()
    
    success, message = provider.send(
        to=phone,
        subject='',
        body='ChainTrack Test: Your SMS notifications are working correctly!'
    )
    
    if success:
        return jsonify({
            'success': True,
            'message': 'Test SMS sent successfully'
        }), 200
    else:
        return jsonify({
            'success': False,
            'error': message
        }), 500


@bp.route('/templates', methods=['GET'])
@jwt_required()
def list_templates():
    """List available notification templates"""
    templates = []
    for name, template in notification_service.TEMPLATES.items():
        templates.append({
            'name': name,
            'subject': template.get('subject', ''),
            'has_email': bool(template.get('body')),
            'has_sms': bool(template.get('sms'))
        })
    
    return jsonify({
        'templates': templates
    }), 200
