"""
Two-Factor Authentication Model
Stores 2FA settings and OTP codes for users
"""

import secrets
from datetime import datetime, timedelta
from .. import db


class TwoFactorAuth(db.Model):
    """Model for storing 2FA settings and OTP codes"""
    
    __tablename__ = 'two_factor_auth'
    
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('users.id'), unique=True, nullable=False)
    
    # 2FA Settings
    is_enabled = db.Column(db.Boolean, default=False)
    method = db.Column(db.String(20), default='email')  # 'email', 'sms', 'app' (future)
    
    # OTP Storage (temporary codes)
    otp_code = db.Column(db.String(6), nullable=True)
    otp_created_at = db.Column(db.DateTime, nullable=True)
    otp_expires_at = db.Column(db.DateTime, nullable=True)
    otp_attempts = db.Column(db.Integer, default=0)
    
    # Backup codes (for recovery)
    backup_codes = db.Column(db.Text, nullable=True)  # JSON array of hashed codes
    
    # Audit
    enabled_at = db.Column(db.DateTime, nullable=True)
    last_used_at = db.Column(db.DateTime, nullable=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Relationship
    user = db.relationship('User', backref=db.backref('two_factor', uselist=False))
    
    # Constants
    OTP_LENGTH = 6
    OTP_EXPIRY_MINUTES = 10
    MAX_OTP_ATTEMPTS = 5
    
    def generate_otp(self):
        """Generate a new 6-digit OTP code"""
        self.otp_code = ''.join([str(secrets.randbelow(10)) for _ in range(self.OTP_LENGTH)])
        self.otp_created_at = datetime.utcnow()
        self.otp_expires_at = datetime.utcnow() + timedelta(minutes=self.OTP_EXPIRY_MINUTES)
        self.otp_attempts = 0
        return self.otp_code
    
    def verify_otp(self, code):
        """
        Verify an OTP code
        Returns: (success, error_message)
        """
        # Check if OTP exists
        if not self.otp_code:
            return False, "No OTP code generated"
        
        # Check if expired
        if datetime.utcnow() > self.otp_expires_at:
            self.clear_otp()
            return False, "OTP has expired"
        
        # Check attempts
        if self.otp_attempts >= self.MAX_OTP_ATTEMPTS:
            self.clear_otp()
            return False, "Too many failed attempts. Please request a new code."
        
        # Verify code
        self.otp_attempts += 1
        if self.otp_code == code:
            self.clear_otp()
            self.last_used_at = datetime.utcnow()
            return True, "OTP verified successfully"
        
        remaining = self.MAX_OTP_ATTEMPTS - self.otp_attempts
        return False, f"Invalid OTP code. {remaining} attempts remaining."
    
    def clear_otp(self):
        """Clear the current OTP"""
        self.otp_code = None
        self.otp_created_at = None
        self.otp_expires_at = None
        self.otp_attempts = 0
    
    def enable(self):
        """Enable 2FA for the user"""
        self.is_enabled = True
        self.enabled_at = datetime.utcnow()
    
    def disable(self):
        """Disable 2FA for the user"""
        self.is_enabled = False
        self.clear_otp()
    
    def generate_backup_codes(self, count=10):
        """Generate backup codes for recovery"""
        import json
        from werkzeug.security import generate_password_hash
        
        codes = []
        hashed_codes = []
        
        for _ in range(count):
            # Generate 8-character alphanumeric code
            code = secrets.token_hex(4).upper()
            codes.append(code)
            hashed_codes.append(generate_password_hash(code))
        
        self.backup_codes = json.dumps(hashed_codes)
        return codes  # Return plain codes to show user once
    
    def verify_backup_code(self, code):
        """Verify and consume a backup code"""
        import json
        from werkzeug.security import check_password_hash
        
        if not self.backup_codes:
            return False
        
        hashed_codes = json.loads(self.backup_codes)
        code = code.upper().replace('-', '').replace(' ', '')
        
        for i, hashed in enumerate(hashed_codes):
            if check_password_hash(hashed, code):
                # Remove used code
                hashed_codes.pop(i)
                self.backup_codes = json.dumps(hashed_codes)
                self.last_used_at = datetime.utcnow()
                return True
        
        return False
    
    def to_dict(self):
        """Serialize 2FA settings"""
        return {
            'is_enabled': self.is_enabled,
            'method': self.method,
            'enabled_at': self.enabled_at.isoformat() if self.enabled_at else None,
            'last_used_at': self.last_used_at.isoformat() if self.last_used_at else None,
            'has_backup_codes': bool(self.backup_codes)
        }
