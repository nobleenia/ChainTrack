"""
Security Utilities
Password validation, rate limiting, and security helpers
"""

import re
import os
from functools import wraps
from flask import request, jsonify, current_app
from datetime import datetime, timedelta

# Password validation regex patterns
PASSWORD_PATTERNS = {
    'uppercase': re.compile(r'[A-Z]'),
    'lowercase': re.compile(r'[a-z]'),
    'digit': re.compile(r'\d'),
    'special': re.compile(r'[!@#$%^&*(),.?":{}|<>\-_=+\[\]\\;\'`~]'),
}


def validate_password(password: str) -> tuple[bool, str]:
    """
    Validate password strength
    
    Requirements:
    - At least 8 characters (12 recommended for production)
    - At least one uppercase letter
    - At least one lowercase letter
    - At least one digit
    - At least one special character
    
    Args:
        password: The password to validate
        
    Returns:
        Tuple of (is_valid, error_message)
    """
    min_length = int(os.environ.get('PASSWORD_MIN_LENGTH', 8))
    
    if len(password) < min_length:
        return False, f"Password must be at least {min_length} characters"
    
    if not PASSWORD_PATTERNS['uppercase'].search(password):
        return False, "Password must contain at least one uppercase letter"
    
    if not PASSWORD_PATTERNS['lowercase'].search(password):
        return False, "Password must contain at least one lowercase letter"
    
    if not PASSWORD_PATTERNS['digit'].search(password):
        return False, "Password must contain at least one digit"
    
    if not PASSWORD_PATTERNS['special'].search(password):
        return False, "Password must contain at least one special character (!@#$%^&*)"
    
    return True, ""


def sanitize_input(value: str, max_length: int = 500) -> str:
    """
    Sanitize user input by stripping whitespace and limiting length
    
    Args:
        value: Input string to sanitize
        max_length: Maximum allowed length
        
    Returns:
        Sanitized string
    """
    if not value:
        return ""
    return str(value).strip()[:max_length]


def get_client_ip() -> str:
    """Get the real client IP, handling proxies"""
    if request.headers.get('X-Forwarded-For'):
        # Get the first IP in the chain (original client)
        return request.headers.get('X-Forwarded-For').split(',')[0].strip()
    elif request.headers.get('X-Real-IP'):
        return request.headers.get('X-Real-IP')
    return request.remote_addr or '0.0.0.0'


def mask_email(email: str) -> str:
    """
    Mask email for logging/display
    Example: john.doe@example.com -> jo***@example.com
    """
    if not email or '@' not in email:
        return '***'
    local, domain = email.split('@', 1)
    if len(local) <= 2:
        masked_local = local[0] + '***'
    else:
        masked_local = local[:2] + '***'
    return f"{masked_local}@{domain}"


def mask_phone(phone: str) -> str:
    """
    Mask phone number for logging/display
    Example: +1234567890 -> +1***7890
    """
    if not phone or len(phone) < 4:
        return '***'
    return phone[:2] + '***' + phone[-4:]


class AccountLockoutManager:
    """
    Manages account lockout after failed login attempts
    Uses in-memory storage (use Redis in production for distributed systems)
    """
    
    _failed_attempts = {}  # {identifier: {'count': int, 'locked_until': datetime}}
    MAX_ATTEMPTS = int(os.environ.get('MAX_LOGIN_ATTEMPTS', 5))
    LOCKOUT_DURATION = int(os.environ.get('LOCKOUT_MINUTES', 15))
    
    @classmethod
    def record_failed_attempt(cls, identifier: str) -> tuple[bool, int]:
        """
        Record a failed login attempt
        
        Args:
            identifier: User email or phone
            
        Returns:
            Tuple of (is_locked, remaining_attempts)
        """
        now = datetime.utcnow()
        
        if identifier not in cls._failed_attempts:
            cls._failed_attempts[identifier] = {'count': 0, 'locked_until': None}
        
        record = cls._failed_attempts[identifier]
        
        # Check if currently locked
        if record['locked_until'] and now < record['locked_until']:
            return True, 0
        
        # Reset if lockout expired
        if record['locked_until'] and now >= record['locked_until']:
            record['count'] = 0
            record['locked_until'] = None
        
        record['count'] += 1
        
        if record['count'] >= cls.MAX_ATTEMPTS:
            record['locked_until'] = now + timedelta(minutes=cls.LOCKOUT_DURATION)
            return True, 0
        
        return False, cls.MAX_ATTEMPTS - record['count']
    
    @classmethod
    def is_locked(cls, identifier: str) -> tuple[bool, int]:
        """
        Check if an account is locked
        
        Args:
            identifier: User email or phone
            
        Returns:
            Tuple of (is_locked, seconds_remaining)
        """
        if identifier not in cls._failed_attempts:
            return False, 0
        
        record = cls._failed_attempts[identifier]
        now = datetime.utcnow()
        
        if record['locked_until'] and now < record['locked_until']:
            remaining = (record['locked_until'] - now).total_seconds()
            return True, int(remaining)
        
        return False, 0
    
    @classmethod
    def clear_attempts(cls, identifier: str):
        """Clear failed attempts after successful login"""
        if identifier in cls._failed_attempts:
            del cls._failed_attempts[identifier]


def add_security_headers(response):
    """
    Add security headers to response
    Call this in after_request handler
    """
    # Prevent clickjacking
    response.headers['X-Frame-Options'] = 'DENY'
    
    # Prevent MIME type sniffing
    response.headers['X-Content-Type-Options'] = 'nosniff'
    
    # XSS Protection (legacy, but still useful)
    response.headers['X-XSS-Protection'] = '1; mode=block'
    
    # Referrer Policy
    response.headers['Referrer-Policy'] = 'strict-origin-when-cross-origin'
    
    # Content Security Policy (basic - customize for your needs)
    response.headers['Content-Security-Policy'] = "default-src 'self'; frame-ancestors 'none'"
    
    # Only add HSTS in production with HTTPS
    if os.environ.get('FLASK_ENV') == 'production':
        response.headers['Strict-Transport-Security'] = 'max-age=31536000; includeSubDomains'
    
    # Permissions Policy (formerly Feature-Policy)
    response.headers['Permissions-Policy'] = 'geolocation=(), microphone=(), camera=()'
    
    return response
