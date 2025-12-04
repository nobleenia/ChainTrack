"""
Transfer Model
Represents custody transfers in the supply chain
"""

from enum import Enum
from datetime import datetime

from .. import db


class TransferType(Enum):
    """Types of transfers in the supply chain"""
    SHIPPED = 'shipped'
    RECEIVED = 'received'
    QUALITY_CHECK = 'quality_check'
    CUSTOMS_CLEARED = 'customs_cleared'
    DELIVERED = 'delivered'
    RETURNED = 'returned'


class Transfer(db.Model):
    """Transfer model for tracking product movement"""
    
    __tablename__ = 'transfers'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Product being transferred
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False, index=True)
    
    # Transfer participants (from is always a registered user)
    from_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # To can be either a registered user OR an external destination
    to_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)  # Changed to nullable
    
    # External recipient details (when transferring to unregistered entity)
    recipient_name = db.Column(db.String(255), nullable=True)  # Store name, company, person
    recipient_address = db.Column(db.String(500), nullable=True)  # Physical address
    recipient_type = db.Column(db.String(50), nullable=True)  # 'store', 'warehouse', 'distributor', 'retailer', 'consumer'
    
    # Transfer details
    transfer_type = db.Column(db.Enum(TransferType), nullable=False)
    location = db.Column(db.String(255), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    
    # Blockchain data
    blockchain_hash = db.Column(db.String(66), nullable=True)
    blockchain_block = db.Column(db.Integer, nullable=True)
    previous_hash = db.Column(db.String(66), nullable=True)  # For chain integrity
    
    # Status
    is_confirmed = db.Column(db.Boolean, default=False)
    confirmed_at = db.Column(db.DateTime, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    def confirm(self):
        """Confirm the transfer was received"""
        self.is_confirmed = True
        self.confirmed_at = datetime.utcnow()
    
    def to_dict(self):
        """Serialize transfer to dictionary"""
        # Determine recipient info (registered user or external)
        if self.to_user_id and self.receiver:
            recipient_info = {
                'type': 'registered',
                'user': self.receiver.to_dict(),
                'name': self.receiver.name,
                'address': None
            }
        else:
            recipient_info = {
                'type': 'external',
                'user': None,
                'name': self.recipient_name,
                'address': self.recipient_address,
                'recipient_type': self.recipient_type
            }
        
        return {
            'id': self.id,
            'product_id': self.product.product_id if self.product else None,
            'from_user': self.sender.to_dict() if self.sender else None,
            'to_user': self.receiver.to_dict() if self.receiver else None,
            'recipient': recipient_info,
            'recipient_name': self.recipient_name,
            'recipient_address': self.recipient_address,
            'recipient_type': self.recipient_type,
            'transfer_type': self.transfer_type.value,
            'location': self.location,
            'notes': self.notes,
            'blockchain_hash': self.blockchain_hash,
            'blockchain_block': self.blockchain_block,
            'is_confirmed': self.is_confirmed,
            'confirmed_at': self.confirmed_at.isoformat() if self.confirmed_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None
        }
    
    def __repr__(self):
        return f'<Transfer {self.id}: {self.transfer_type.value}>'
