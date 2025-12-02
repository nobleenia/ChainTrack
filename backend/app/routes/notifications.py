"""
Notification Routes for ChainTrack
API endpoints for notification status and preferences
"""

from flask import Blueprint, request, jsonify
from flask_jwt_extended import jwt_required, get_jwt_identity

from ..services.notification_service import notification_service

bp = Blueprint('notifications', __name__)


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
