"""
User Model
Represents users in the supply chain with role-based access
"""

from enum import Enum
from datetime import datetime
from werkzeug.security import generate_password_hash, check_password_hash

from .. import db


class UserRole(Enum):
    """User roles in the supply chain"""
    MANUFACTURER = 'manufacturer'
    DISTRIBUTOR = 'distributor'
    RETAILER = 'retailer'
    CONSUMER = 'consumer'
    ADMIN = 'admin'


class User(db.Model):
    """User model for authentication and role-based access"""
    
    __tablename__ = 'users'
    
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False, index=True)
    password_hash = db.Column(db.String(256), nullable=False)
    
    # Profile information
    name = db.Column(db.String(100), nullable=False)
    company_name = db.Column(db.String(200), nullable=True)
    phone = db.Column(db.String(20), nullable=True)
    
    # Role and permissions
    role = db.Column(db.Enum(UserRole), nullable=False, default=UserRole.CONSUMER)
    is_verified = db.Column(db.Boolean, default=False)
    is_active = db.Column(db.Boolean, default=True)
    
    # Blockchain wallet (optional, for direct blockchain interactions)
    wallet_address = db.Column(db.String(42), nullable=True, unique=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_login = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    products = db.relationship('Product', backref='manufacturer', lazy='dynamic',
                               foreign_keys='Product.manufacturer_id')
    transfers_sent = db.relationship('Transfer', backref='sender', lazy='dynamic',
                                     foreign_keys='Transfer.from_user_id')
    transfers_received = db.relationship('Transfer', backref='receiver', lazy='dynamic',
                                         foreign_keys='Transfer.to_user_id')
    
    def set_password(self, password):
        """Hash and set the user's password"""
        self.password_hash = generate_password_hash(password)
    
    def check_password(self, password):
        """Verify the password against the stored hash"""
        return check_password_hash(self.password_hash, password)
    
    def can_register_products(self):
        """Check if user can register new products"""
        return self.role in [UserRole.MANUFACTURER, UserRole.ADMIN]
    
    def can_transfer_products(self):
        """Check if user can transfer products"""
        return self.role in [UserRole.MANUFACTURER, UserRole.DISTRIBUTOR, 
                            UserRole.RETAILER, UserRole.ADMIN]
    
    def to_dict(self):
        """Serialize user to dictionary (private - for authenticated user's own profile)"""
        return {
            'id': self.id,
            'email': self.email,
            'name': self.name,
            'company_name': self.company_name,
            'phone': self.phone,
            'role': self.role.value,
            'is_verified': self.is_verified,
            'wallet_address': self.wallet_address,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def to_public_dict(self):
        """Serialize user to dictionary (public - safe for other users to see)"""
        return {
            'id': self.id,
            'name': self.name,
            'company_name': self.company_name,
            'role': self.role.value,
            'is_verified': self.is_verified,
        }
    
    def to_minimal_dict(self):
        """Minimal user info for references in other objects"""
        return {
            'id': self.id,
            'name': self.name,
            'role': self.role.value,
        }
    
    def __repr__(self):
        return f'<User {self.email} ({self.role.value})>'
