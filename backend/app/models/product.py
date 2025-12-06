"""
Product Model
Represents products tracked on the blockchain supply chain
"""

import uuid
import hashlib
from enum import Enum
from datetime import datetime

from .. import db


class ProductStatus(Enum):
    """Product status in the supply chain"""
    REGISTERED = 'registered'
    IN_TRANSIT = 'in_transit'
    DELIVERED = 'delivered'
    VERIFIED = 'verified'
    RECALLED = 'recalled'
    PENDING_TRANSFER = 'pending_transfer'  # Awaiting ownership transfer acceptance


class Product(db.Model):
    """Product model with blockchain integration"""
    
    __tablename__ = 'products'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Unique product identifier (human-readable)
    product_id = db.Column(db.String(50), unique=True, nullable=False, index=True)
    
    # Product information
    name = db.Column(db.String(200), nullable=False)
    description = db.Column(db.Text, nullable=True)
    category = db.Column(db.String(100), nullable=True)
    
    # Manufacturing details
    production_date = db.Column(db.Date, nullable=False)
    expiry_date = db.Column(db.Date, nullable=True)
    batch_number = db.Column(db.String(100), nullable=True)
    manufacturing_location = db.Column(db.String(255), nullable=False)
    
    # Current status and location
    status = db.Column(db.Enum(ProductStatus), default=ProductStatus.REGISTERED)
    current_location = db.Column(db.String(255), nullable=True)
    current_holder_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # Pending transfer lock - prevents multiple transfers, unlocks on accept/reject/cancel
    pending_transfer_id = db.Column(db.Integer, db.ForeignKey('transfers.id'), nullable=True)
    
    # Blockchain data
    blockchain_hash = db.Column(db.String(66), nullable=True)  # Ethereum tx hash
    blockchain_block = db.Column(db.Integer, nullable=True)
    ipfs_hash = db.Column(db.String(100), nullable=True)  # For storing additional metadata
    
    # QR Code
    qr_code_url = db.Column(db.String(255), nullable=True)
    
    # Relationships
    manufacturer_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # Specify foreign_keys to disambiguate since we have two FK relationships with transfers table
    # (product_id on Transfer, and pending_transfer_id on Product)
    transfers = db.relationship('Transfer', 
                               foreign_keys='Transfer.product_id',
                               backref='product', 
                               lazy='dynamic',
                               order_by='Transfer.created_at')
    
    # Relationship to the pending transfer (if any)
    pending_transfer = db.relationship('Transfer',
                                       foreign_keys=[pending_transfer_id],
                                       uselist=False,
                                       post_update=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    
    # Verification count
    verification_count = db.Column(db.Integer, default=0)
    last_verified_at = db.Column(db.DateTime, nullable=True)
    
    @staticmethod
    def generate_product_id(name, manufacturer_id):
        """Generate a unique human-readable product ID"""
        prefix = ''.join(c for c in name[:3].upper() if c.isalnum())
        unique_part = uuid.uuid4().hex[:6].upper()
        return f"PRD-{prefix}-{unique_part}"
    
    def generate_hash(self):
        """Generate a cryptographic hash of the product data"""
        data = f"{self.product_id}|{self.name}|{self.manufacturer_id}|{self.production_date}|{self.manufacturing_location}"
        return hashlib.sha256(data.encode()).hexdigest()
    
    def get_journey(self):
        """Get the complete journey of the product"""
        journey = [{
            'event': 'MANUFACTURED',
            'timestamp': self.created_at.isoformat(),
            'location': self.manufacturing_location,
            'actor': self.manufacturer.name if self.manufacturer else 'Unknown',
            'blockchain_hash': self.blockchain_hash
        }]
        
        for transfer in self.transfers.order_by('created_at'):
            journey.append({
                'event': transfer.transfer_type.value.upper(),
                'timestamp': transfer.created_at.isoformat(),
                'location': transfer.location,
                'actor': transfer.receiver.name if transfer.receiver else 'Unknown',
                'blockchain_hash': transfer.blockchain_hash,
                'notes': transfer.notes
            })
        
        return journey
    
    def increment_verification(self):
        """Increment verification count"""
        self.verification_count += 1
        self.last_verified_at = datetime.utcnow()
        self.status = ProductStatus.VERIFIED
    
    def to_dict(self, include_journey=False):
        """Serialize product to dictionary"""
        # Check if product has a pending transfer
        has_pending_transfer = self.pending_transfer_id is not None
        
        data = {
            'id': self.id,
            'product_id': self.product_id,
            'name': self.name,
            'description': self.description,
            'category': self.category,
            'production_date': self.production_date.isoformat() if self.production_date else None,
            'expiry_date': self.expiry_date.isoformat() if self.expiry_date else None,
            'batch_number': self.batch_number,
            'manufacturing_location': self.manufacturing_location,
            'status': self.status.value,
            'current_location': self.current_location,
            'current_holder_id': self.current_holder_id,
            'blockchain_hash': self.blockchain_hash,
            'blockchain_block': self.blockchain_block,
            'qr_code_url': self.qr_code_url,
            'manufacturer': self.manufacturer.to_dict() if self.manufacturer else None,
            'verification_count': self.verification_count,
            'last_verified_at': self.last_verified_at.isoformat() if self.last_verified_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            # Transfer status fields
            'has_pending_transfer': has_pending_transfer,
            'pending_transfer_id': self.pending_transfer_id,
            'can_transfer': not has_pending_transfer,  # Can only transfer if no pending transfer
        }
        
        if include_journey:
            data['journey'] = self.get_journey()
        
        return data
    
    def __repr__(self):
        return f'<Product {self.product_id}: {self.name}>'
