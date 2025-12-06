"""
Two-Factor Authentication Service
Handles OTP generation, email delivery, and verification
"""

import os
import logging
from datetime import datetime
from typing import Tuple, Optional

from .. import db
from ..models import User, TwoFactorAuth

logger = logging.getLogger(__name__)


class TwoFactorService:
    """Service for managing Two-Factor Authentication"""
    
    # Email templates
    OTP_EMAIL_SUBJECT = "ChainTrack: Your Verification Code"
    
    OTP_EMAIL_BODY = """Hello {name},

Your ChainTrack verification code is:

    {otp_code}

This code will expire in {expiry_minutes} minutes.

If you didn't request this code, please ignore this email or contact support if you have concerns.

Best regards,
ChainTrack Security Team"""

    OTP_EMAIL_HTML = """
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>
        body {{ font-family: Arial, sans-serif; line-height: 1.6; color: #333; }}
        .container {{ max-width: 600px; margin: 0 auto; padding: 20px; }}
        .header {{ background: linear-gradient(135deg, #4F46E5 0%, #7C3AED 100%); padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }}
        .header h1 {{ color: white; margin: 0; }}
        .content {{ background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; }}
        .otp-box {{ background: white; border: 2px dashed #4F46E5; border-radius: 10px; padding: 20px; text-align: center; margin: 20px 0; }}
        .otp-code {{ font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #4F46E5; }}
        .expiry {{ color: #666; font-size: 14px; }}
        .warning {{ background: #fef3c7; border-left: 4px solid #f59e0b; padding: 10px 15px; margin: 20px 0; }}
        .footer {{ text-align: center; color: #666; font-size: 12px; margin-top: 20px; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🔐 Verification Code</h1>
        </div>
        <div class="content">
            <p>Hello <strong>{name}</strong>,</p>
            <p>You requested a verification code for your ChainTrack account. Enter this code to continue:</p>
            
            <div class="otp-box">
                <div class="otp-code">{otp_code}</div>
                <p class="expiry">⏱️ Expires in {expiry_minutes} minutes</p>
            </div>
            
            <div class="warning">
                <strong>⚠️ Security Notice:</strong> Never share this code with anyone. ChainTrack staff will never ask for your verification code.
            </div>
            
            <p>If you didn't request this code, you can safely ignore this email.</p>
        </div>
        <div class="footer">
            <p>© {year} ChainTrack. Securing the supply chain.</p>
        </div>
    </div>
</body>
</html>
"""

    ENABLE_2FA_SUBJECT = "ChainTrack: Two-Factor Authentication Enabled"
    
    ENABLE_2FA_BODY = """Hello {name},

Two-Factor Authentication has been successfully enabled on your ChainTrack account.

From now on, you'll need to enter a verification code sent to your email when logging in.

Your backup codes have been generated. Please save them in a secure location - you'll need them if you lose access to your email.

If you didn't enable 2FA, please contact support immediately.

Best regards,
ChainTrack Security Team"""

    def __init__(self):
        self.from_email = os.environ.get('NOTIFICATION_FROM_EMAIL', 'noreply@chaintrack.io')
        self.from_name = os.environ.get('NOTIFICATION_FROM_NAME', 'ChainTrack')
    
    def get_or_create_2fa(self, user: User) -> TwoFactorAuth:
        """Get or create 2FA record for a user"""
        if user.two_factor:
            return user.two_factor
        
        two_factor = TwoFactorAuth(user_id=user.id)
        db.session.add(two_factor)
        db.session.commit()
        return two_factor
    
    def is_2fa_enabled(self, user: User) -> bool:
        """Check if 2FA is enabled for a user"""
        return user.two_factor and user.two_factor.is_enabled
    
    def send_otp_email(self, user: User, otp_code: str, purpose: str = "login") -> Tuple[bool, str]:
        """Send OTP code via email"""
        try:
            from .notification_service import BrevoEmailProvider, SendGridEmailProvider
            
            # Try Brevo first
            email_provider = BrevoEmailProvider()
            if not email_provider.is_configured():
                email_provider = SendGridEmailProvider()
            
            if not email_provider.is_configured():
                logger.error("No email provider configured for 2FA")
                return False, "Email service not configured"
            
            # Prepare email content
            expiry_minutes = TwoFactorAuth.OTP_EXPIRY_MINUTES
            year = datetime.utcnow().year
            
            body = self.OTP_EMAIL_BODY.format(
                name=user.name,
                otp_code=otp_code,
                expiry_minutes=expiry_minutes
            )
            
            html_body = self.OTP_EMAIL_HTML.format(
                name=user.name,
                otp_code=otp_code,
                expiry_minutes=expiry_minutes,
                year=year
            )
            
            # Send email
            success, message = email_provider.send(
                to=user.email,
                subject=self.OTP_EMAIL_SUBJECT,
                body=body,
                html_body=html_body
            )
            
            if success:
                logger.info(f"OTP email sent to {user.email} for {purpose}")
            else:
                logger.error(f"Failed to send OTP email: {message}")
            
            return success, message
            
        except Exception as e:
            logger.error(f"Error sending OTP email: {str(e)}")
            return False, str(e)
    
    def initiate_2fa_setup(self, user: User) -> Tuple[bool, str, Optional[str]]:
        """
        Start the 2FA setup process by sending verification OTP
        Returns: (success, message, otp_code for testing only)
        """
        two_factor = self.get_or_create_2fa(user)
        
        if two_factor.is_enabled:
            return False, "2FA is already enabled on this account", None
        
        # Generate OTP
        otp_code = two_factor.generate_otp()
        db.session.commit()
        
        # Send OTP email
        success, message = self.send_otp_email(user, otp_code, purpose="2fa_setup")
        
        if not success:
            return False, f"Failed to send verification code: {message}", None
        
        return True, "Verification code sent to your email", None
    
    def complete_2fa_setup(self, user: User, otp_code: str) -> Tuple[bool, str, Optional[list]]:
        """
        Complete 2FA setup by verifying OTP and generating backup codes
        Returns: (success, message, backup_codes)
        """
        two_factor = self.get_or_create_2fa(user)
        
        if two_factor.is_enabled:
            return False, "2FA is already enabled", None
        
        # Verify OTP
        valid, message = two_factor.verify_otp(otp_code)
        
        if not valid:
            db.session.commit()
            return False, message, None
        
        # Enable 2FA and generate backup codes
        two_factor.enable()
        backup_codes = two_factor.generate_backup_codes()
        db.session.commit()
        
        # Send confirmation email
        self._send_2fa_enabled_email(user)
        
        logger.info(f"2FA enabled for user {user.email}")
        return True, "Two-factor authentication enabled successfully", backup_codes
    
    def disable_2fa(self, user: User, password: str) -> Tuple[bool, str]:
        """
        Disable 2FA (requires password verification)
        """
        # Verify password
        if not user.check_password(password):
            return False, "Invalid password"
        
        two_factor = user.two_factor
        if not two_factor or not two_factor.is_enabled:
            return False, "2FA is not enabled on this account"
        
        two_factor.disable()
        db.session.commit()
        
        logger.info(f"2FA disabled for user {user.email}")
        return True, "Two-factor authentication disabled"
    
    def send_login_otp(self, user: User) -> Tuple[bool, str]:
        """
        Send OTP for login verification
        """
        two_factor = user.two_factor
        if not two_factor or not two_factor.is_enabled:
            return False, "2FA is not enabled"
        
        # Generate new OTP
        otp_code = two_factor.generate_otp()
        db.session.commit()
        
        # Send email
        success, message = self.send_otp_email(user, otp_code, purpose="login")
        
        if not success:
            return False, f"Failed to send verification code: {message}"
        
        return True, "Verification code sent to your email"
    
    def verify_login_otp(self, user: User, otp_code: str) -> Tuple[bool, str]:
        """
        Verify OTP during login
        """
        two_factor = user.two_factor
        if not two_factor:
            return False, "2FA not configured"
        
        # Try OTP first
        valid, message = two_factor.verify_otp(otp_code)
        db.session.commit()
        
        if valid:
            return True, "Verification successful"
        
        # Try backup code if OTP fails
        if two_factor.verify_backup_code(otp_code):
            db.session.commit()
            return True, "Backup code verified (remember to save remaining codes)"
        
        return False, message
    
    def regenerate_backup_codes(self, user: User, password: str) -> Tuple[bool, str, Optional[list]]:
        """
        Regenerate backup codes (requires password verification)
        """
        if not user.check_password(password):
            return False, "Invalid password", None
        
        two_factor = user.two_factor
        if not two_factor or not two_factor.is_enabled:
            return False, "2FA is not enabled", None
        
        backup_codes = two_factor.generate_backup_codes()
        db.session.commit()
        
        logger.info(f"Backup codes regenerated for user {user.email}")
        return True, "New backup codes generated", backup_codes
    
    def _send_2fa_enabled_email(self, user: User):
        """Send confirmation email when 2FA is enabled"""
        try:
            from .notification_service import BrevoEmailProvider, SendGridEmailProvider
            
            email_provider = BrevoEmailProvider()
            if not email_provider.is_configured():
                email_provider = SendGridEmailProvider()
            
            if not email_provider.is_configured():
                return
            
            body = self.ENABLE_2FA_BODY.format(name=user.name)
            
            email_provider.send(
                to=user.email,
                subject=self.ENABLE_2FA_SUBJECT,
                body=body
            )
        except Exception as e:
            logger.error(f"Failed to send 2FA enabled email: {e}")


# Singleton instance
two_factor_service = TwoFactorService()
