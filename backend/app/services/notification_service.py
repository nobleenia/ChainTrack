"""
Notification Service for ChainTrack
Handles email and SMS notifications for shipment status updates
"""

import os
import logging
from typing import Optional, Dict, Any, Tuple
from datetime import datetime
from abc import ABC, abstractmethod

logger = logging.getLogger(__name__)


class NotificationProvider(ABC):
    """Abstract base class for notification providers"""
    
    @abstractmethod
    def send(self, to: str, subject: str, body: str, **kwargs) -> Tuple[bool, str]:
        """Send a notification"""
        pass
    
    @abstractmethod
    def is_configured(self) -> bool:
        """Check if provider is properly configured"""
        pass


class EmailProvider(NotificationProvider):
    """Email notification provider using SendGrid"""
    
    def __init__(self):
        self.api_key = os.environ.get('SENDGRID_API_KEY')
        self.from_email = os.environ.get('NOTIFICATION_FROM_EMAIL', 'noreply@chaintrack.io')
        self.from_name = os.environ.get('NOTIFICATION_FROM_NAME', 'ChainTrack')
        
    def is_configured(self) -> bool:
        return bool(self.api_key)
    
    def send(self, to: str, subject: str, body: str, html_body: str = None, **kwargs) -> Tuple[bool, str]:
        """
        Send an email via SendGrid
        
        Args:
            to: Recipient email address
            subject: Email subject
            body: Plain text body
            html_body: Optional HTML body
            
        Returns:
            Tuple of (success, message)
        """
        if not self.is_configured():
            logger.warning("SendGrid not configured, skipping email notification")
            return False, "Email service not configured"
        
        try:
            import sendgrid
            from sendgrid.helpers.mail import Mail, Email, To, Content
            
            sg = sendgrid.SendGridAPIClient(api_key=self.api_key)
            
            from_email = Email(self.from_email, self.from_name)
            to_email = To(to)
            
            # Create message with plain text
            content = Content("text/plain", body)
            mail = Mail(from_email, to_email, subject, content)
            
            # Add HTML content if provided
            if html_body:
                mail.add_content(Content("text/html", html_body))
            
            response = sg.client.mail.send.post(request_body=mail.get())
            
            if response.status_code in [200, 201, 202]:
                logger.info(f"Email sent successfully to {to}")
                return True, "Email sent successfully"
            else:
                logger.error(f"Email failed: {response.status_code}")
                return False, f"Email failed with status {response.status_code}"
                
        except ImportError:
            logger.error("SendGrid library not installed")
            return False, "SendGrid library not installed"
        except Exception as e:
            logger.error(f"Email error: {str(e)}")
            return False, str(e)


class SMSProvider(NotificationProvider):
    """SMS notification provider using Twilio"""
    
    def __init__(self):
        self.account_sid = os.environ.get('TWILIO_ACCOUNT_SID')
        self.auth_token = os.environ.get('TWILIO_AUTH_TOKEN')
        self.from_number = os.environ.get('TWILIO_FROM_NUMBER')
        
    def is_configured(self) -> bool:
        return all([self.account_sid, self.auth_token, self.from_number])
    
    def send(self, to: str, subject: str, body: str, **kwargs) -> Tuple[bool, str]:
        """
        Send an SMS via Twilio
        
        Args:
            to: Recipient phone number (with country code)
            subject: Not used for SMS, but included for interface consistency
            body: SMS message body (will be truncated if > 1600 chars)
            
        Returns:
            Tuple of (success, message)
        """
        if not self.is_configured():
            logger.warning("Twilio not configured, skipping SMS notification")
            return False, "SMS service not configured"
        
        try:
            from twilio.rest import Client
            
            client = Client(self.account_sid, self.auth_token)
            
            # Truncate message if needed (SMS limit is 1600 chars for concatenated SMS)
            if len(body) > 1600:
                body = body[:1597] + "..."
            
            # Ensure phone number has + prefix
            if not to.startswith('+'):
                to = '+' + to
            
            message = client.messages.create(
                body=body,
                from_=self.from_number,
                to=to
            )
            
            logger.info(f"SMS sent successfully to {to}, SID: {message.sid}")
            return True, f"SMS sent successfully (SID: {message.sid})"
            
        except ImportError:
            logger.error("Twilio library not installed")
            return False, "Twilio library not installed"
        except Exception as e:
            logger.error(f"SMS error: {str(e)}")
            return False, str(e)


class NotificationService:
    """
    Main notification service that coordinates email and SMS notifications
    """
    
    # Notification templates
    TEMPLATES = {
        'shipment_created': {
            'subject': 'ChainTrack: New Shipment Created - {tracking_id}',
            'body': '''Hello {recipient_name},

A new shipment has been created for you!

Tracking ID: {tracking_id}
PIN: {tracking_pin}
Description: {description}

From: {sender_name}
Pickup: {pickup_address}
Delivery: {delivery_address}

Track your shipment at: {tracking_url}

Best regards,
ChainTrack Team''',
            'sms': 'ChainTrack: Shipment {tracking_id} created. PIN: {tracking_pin}. Track at {tracking_url}'
        },
        
        'shipment_picked_up': {
            'subject': 'ChainTrack: Shipment Picked Up - {tracking_id}',
            'body': '''Hello {recipient_name},

Your shipment has been picked up by the courier!

Tracking ID: {tracking_id}
Handler: {handler_name}
Location: {location}
Time: {timestamp}

Track your shipment at: {tracking_url}

Best regards,
ChainTrack Team''',
            'sms': 'ChainTrack: Shipment {tracking_id} picked up by {handler_name}. Track at {tracking_url}'
        },
        
        'shipment_in_transit': {
            'subject': 'ChainTrack: Shipment In Transit - {tracking_id}',
            'body': '''Hello {recipient_name},

Your shipment is on its way!

Tracking ID: {tracking_id}
Current Location: {location}
Last Update: {timestamp}
Status: {status_update}

Track your shipment at: {tracking_url}

Best regards,
ChainTrack Team''',
            'sms': 'ChainTrack: Shipment {tracking_id} in transit. Location: {location}. Track at {tracking_url}'
        },
        
        'shipment_out_for_delivery': {
            'subject': 'ChainTrack: Shipment Out for Delivery - {tracking_id}',
            'body': '''Hello {recipient_name},

Great news! Your shipment is out for delivery!

Tracking ID: {tracking_id}
Delivery Address: {delivery_address}
Estimated: Today

Please ensure someone is available to receive the package.

PIN for confirmation: {tracking_pin}

Track your shipment at: {tracking_url}

Best regards,
ChainTrack Team''',
            'sms': 'ChainTrack: Shipment {tracking_id} out for delivery! PIN: {tracking_pin} for confirmation.'
        },
        
        'shipment_delivered': {
            'subject': 'ChainTrack: Shipment Delivered - {tracking_id}',
            'body': '''Hello {recipient_name},

Your shipment has been delivered!

Tracking ID: {tracking_id}
Delivered to: {delivered_to}
Time: {timestamp}
Location: {location}

Please confirm receipt using your PIN at: {tracking_url}

Best regards,
ChainTrack Team''',
            'sms': 'ChainTrack: Shipment {tracking_id} delivered to {delivered_to}. Confirm at {tracking_url}'
        },
        
        'shipment_confirmed': {
            'subject': 'ChainTrack: Delivery Confirmed - {tracking_id}',
            'body': '''Hello {sender_name},

Great news! Your shipment has been confirmed as received!

Tracking ID: {tracking_id}
Confirmed by: {confirmed_by}
Time: {timestamp}

Thank you for using ChainTrack!

Best regards,
ChainTrack Team''',
            'sms': 'ChainTrack: Shipment {tracking_id} confirmed by {confirmed_by}. Delivery complete!'
        },
        
        'checkpoint_update': {
            'subject': 'ChainTrack: Shipment Update - {tracking_id}',
            'body': '''Hello {recipient_name},

There's an update on your shipment!

Tracking ID: {tracking_id}
Status: {status_update}
Location: {location}
Time: {timestamp}
Notes: {notes}

Track your shipment at: {tracking_url}

Best regards,
ChainTrack Team''',
            'sms': 'ChainTrack: {tracking_id} update - {status_update}. Location: {location}'
        }
    }
    
    def __init__(self):
        self.email_provider = EmailProvider()
        self.sms_provider = SMSProvider()
        self.base_url = os.environ.get('FRONTEND_URL', 'http://localhost:5173')
        
    @property
    def is_email_configured(self) -> bool:
        return self.email_provider.is_configured()
    
    @property
    def is_sms_configured(self) -> bool:
        return self.sms_provider.is_configured()
    
    def get_tracking_url(self, tracking_id: str) -> str:
        """Generate the tracking URL for a shipment"""
        return f"{self.base_url}/track?id={tracking_id}"
    
    def _render_template(self, template_name: str, data: Dict[str, Any], format: str = 'body') -> str:
        """Render a notification template with data"""
        template = self.TEMPLATES.get(template_name, {}).get(format, '')
        
        # Add tracking URL if not present
        if 'tracking_url' not in data and 'tracking_id' in data:
            data['tracking_url'] = self.get_tracking_url(data['tracking_id'])
        
        # Format timestamp if present
        if 'timestamp' in data and isinstance(data['timestamp'], datetime):
            data['timestamp'] = data['timestamp'].strftime('%Y-%m-%d %H:%M:%S')
        
        # Replace placeholders
        try:
            return template.format(**data)
        except KeyError as e:
            logger.warning(f"Missing template variable: {e}")
            # Return template with missing values as empty
            for key in data:
                template = template.replace('{' + key + '}', str(data.get(key, '')))
            return template
    
    def send_notification(
        self,
        template_name: str,
        data: Dict[str, Any],
        email: Optional[str] = None,
        phone: Optional[str] = None,
        send_email: bool = True,
        send_sms: bool = True
    ) -> Dict[str, Any]:
        """
        Send notification via email and/or SMS
        
        Args:
            template_name: Name of the template to use
            data: Template data (tracking_id, recipient_name, etc.)
            email: Recipient email address
            phone: Recipient phone number
            send_email: Whether to send email
            send_sms: Whether to send SMS
            
        Returns:
            Dict with results for each channel
        """
        results = {
            'email': {'sent': False, 'message': None},
            'sms': {'sent': False, 'message': None}
        }
        
        if template_name not in self.TEMPLATES:
            logger.error(f"Unknown notification template: {template_name}")
            return results
        
        # Send email
        if send_email and email:
            subject = self._render_template(template_name, data, 'subject')
            body = self._render_template(template_name, data, 'body')
            
            success, message = self.email_provider.send(email, subject, body)
            results['email'] = {'sent': success, 'message': message}
        
        # Send SMS
        if send_sms and phone:
            sms_body = self._render_template(template_name, data, 'sms')
            
            success, message = self.sms_provider.send(phone, '', sms_body)
            results['sms'] = {'sent': success, 'message': message}
        
        return results
    
    def notify_shipment_created(self, shipment, sender_name: str = None) -> Dict[str, Any]:
        """Notify recipient about new shipment"""
        data = {
            'tracking_id': shipment.shipment_id,
            'tracking_pin': shipment.tracking_pin,
            'description': shipment.description,
            'sender_name': sender_name or 'Sender',
            'recipient_name': shipment.receiver_name,
            'pickup_address': shipment.pickup_address,
            'delivery_address': shipment.delivery_address
        }
        
        return self.send_notification(
            'shipment_created',
            data,
            email=shipment.receiver_email,
            phone=shipment.receiver_phone
        )
    
    def notify_shipment_picked_up(self, shipment, handler_name: str, location: str = None) -> Dict[str, Any]:
        """Notify recipient about shipment pickup"""
        data = {
            'tracking_id': shipment.shipment_id,
            'recipient_name': shipment.receiver_name,
            'handler_name': handler_name,
            'location': location or 'Pickup location',
            'timestamp': datetime.utcnow()
        }
        
        return self.send_notification(
            'shipment_picked_up',
            data,
            email=shipment.receiver_email,
            phone=shipment.receiver_phone
        )
    
    def notify_shipment_in_transit(self, shipment, location: str, status_update: str = None) -> Dict[str, Any]:
        """Notify recipient about shipment in transit"""
        data = {
            'tracking_id': shipment.shipment_id,
            'recipient_name': shipment.receiver_name,
            'location': location,
            'status_update': status_update or 'Package is on its way',
            'timestamp': datetime.utcnow()
        }
        
        return self.send_notification(
            'shipment_in_transit',
            data,
            email=shipment.receiver_email,
            phone=shipment.receiver_phone
        )
    
    def notify_out_for_delivery(self, shipment) -> Dict[str, Any]:
        """Notify recipient shipment is out for delivery"""
        data = {
            'tracking_id': shipment.shipment_id,
            'tracking_pin': shipment.tracking_pin,
            'recipient_name': shipment.receiver_name,
            'delivery_address': shipment.delivery_address
        }
        
        return self.send_notification(
            'shipment_out_for_delivery',
            data,
            email=shipment.receiver_email,
            phone=shipment.receiver_phone
        )
    
    def notify_shipment_delivered(self, shipment, delivered_to: str, location: str = None) -> Dict[str, Any]:
        """Notify recipient about delivery"""
        data = {
            'tracking_id': shipment.shipment_id,
            'recipient_name': shipment.receiver_name,
            'delivered_to': delivered_to,
            'location': location or shipment.delivery_address,
            'timestamp': datetime.utcnow()
        }
        
        return self.send_notification(
            'shipment_delivered',
            data,
            email=shipment.receiver_email,
            phone=shipment.receiver_phone
        )
    
    def notify_delivery_confirmed(self, shipment, confirmed_by: str, sender_email: str = None) -> Dict[str, Any]:
        """Notify sender about delivery confirmation"""
        data = {
            'tracking_id': shipment.shipment_id,
            'sender_name': 'Sender',  # Would need to fetch from user
            'confirmed_by': confirmed_by,
            'timestamp': datetime.utcnow()
        }
        
        # This notification goes to the sender
        return self.send_notification(
            'shipment_confirmed',
            data,
            email=sender_email,
            send_sms=False  # Only email for sender confirmation
        )
    
    def notify_checkpoint(
        self,
        shipment,
        status_update: str,
        location: str = None,
        notes: str = None
    ) -> Dict[str, Any]:
        """Send general checkpoint update notification"""
        data = {
            'tracking_id': shipment.shipment_id,
            'recipient_name': shipment.receiver_name,
            'status_update': status_update,
            'location': location or 'N/A',
            'notes': notes or 'No additional notes',
            'timestamp': datetime.utcnow()
        }
        
        return self.send_notification(
            'checkpoint_update',
            data,
            email=shipment.receiver_email,
            phone=shipment.receiver_phone
        )


# Singleton instance
notification_service = NotificationService()
