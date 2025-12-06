"""
Transfer Model
Represents custody/ownership transfers in the supply chain
Transfers are distinct from shipments - transfers change ownership, shipments track physical movement
"""

from enum import Enum
from datetime import datetime
import secrets
import string

from .. import db


class TransferType(Enum):
    """Types of transfers in the supply chain"""
    SHIPPED = 'shipped'
    RECEIVED = 'received'
    QUALITY_CHECK = 'quality_check'
    CUSTOMS_CLEARED = 'customs_cleared'
    DELIVERED = 'delivered'
    RETURNED = 'returned'


class TransferStatus(Enum):
    """Status of ownership transfer"""
    PENDING = 'pending'       # Transfer initiated, awaiting acceptance
    ACCEPTED = 'accepted'     # Receiver accepted ownership
    REJECTED = 'rejected'     # Receiver declined the transfer
    CANCELLED = 'cancelled'   # Sender cancelled before acceptance
    EXPIRED = 'expired'       # Transfer expired (not claimed in time)


def generate_claim_token():
    """Generate a secure token for external recipients to claim transfer"""
    return secrets.token_urlsafe(32)


class Transfer(db.Model):
    """
    Transfer model for tracking ownership changes
    
    Key distinction from Shipment:
    - Transfer = change of ownership (legal custody)
    - Shipment = physical movement tracking
    
    A product can be shipped multiple times without transfer (e.g., to warehouse)
    A transfer finalizes who legally owns/controls the product
    """
    
    __tablename__ = 'transfers'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Product being transferred
    product_id = db.Column(db.Integer, db.ForeignKey('products.id'), nullable=False, index=True)
    
    # Transfer participants (from is always a registered user)
    from_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # To can be either a registered user OR an external destination
    to_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    
    # External recipient details (when transferring to unregistered entity)
    recipient_name = db.Column(db.String(255), nullable=True)  # Store name, company, person
    recipient_address = db.Column(db.String(500), nullable=True)  # Physical address
    recipient_type = db.Column(db.String(50), nullable=True)  # 'store', 'warehouse', 'distributor', 'retailer', 'consumer'
    recipient_email = db.Column(db.String(255), nullable=True)  # For sending claim link
    recipient_phone = db.Column(db.String(50), nullable=True)   # For SMS claim link
    
    # Claim token for external recipients (unregistered users)
    claim_token = db.Column(db.String(64), unique=True, nullable=True, index=True)
    claim_token_expires_at = db.Column(db.DateTime, nullable=True)
    
    # Transfer details
    transfer_type = db.Column(db.Enum(TransferType), nullable=False)
    location = db.Column(db.String(255), nullable=False)
    notes = db.Column(db.Text, nullable=True)
    
    # Blockchain data
    blockchain_hash = db.Column(db.String(66), nullable=True)
    blockchain_block = db.Column(db.Integer, nullable=True)
    previous_hash = db.Column(db.String(66), nullable=True)  # For chain integrity
    
    # Transfer Status (new proper status field)
    status = db.Column(db.Enum(TransferStatus), default=TransferStatus.PENDING, nullable=False)
    
    # Legacy field - kept for backwards compatibility, now derived from status
    is_confirmed = db.Column(db.Boolean, default=False)
    confirmed_at = db.Column(db.DateTime, nullable=True)
    
    # Rejection/cancellation reason
    rejection_reason = db.Column(db.Text, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    responded_at = db.Column(db.DateTime, nullable=True)  # When accepted/rejected
    
    def generate_claim_token(self, expires_in_days=7):
        """Generate a claim token for external recipients"""
        self.claim_token = generate_claim_token()
        self.claim_token_expires_at = datetime.utcnow() + timedelta(days=expires_in_days)
        return self.claim_token
    
    def is_claim_token_valid(self):
        """Check if claim token is still valid"""
        if not self.claim_token:
            return False
        if self.claim_token_expires_at and datetime.utcnow() > self.claim_token_expires_at:
            return False
        return self.status == TransferStatus.PENDING
    
    def accept(self, user_id=None):
        """
        Accept the transfer - this finalizes ownership change
        
        Args:
            user_id: The ID of the user accepting (required for registered users)
        """
        from .product import Product
        
        self.status = TransferStatus.ACCEPTED
        self.is_confirmed = True  # Backwards compatibility
        self.confirmed_at = datetime.utcnow()
        self.responded_at = datetime.utcnow()
        
        # Update to_user_id if a registered user is claiming
        if user_id and not self.to_user_id:
            self.to_user_id = user_id
        
        # NOW transfer ownership - this is when current_holder_id changes
        product = Product.query.get(self.product_id)
        if product and self.to_user_id:
            product.current_holder_id = self.to_user_id
            product.pending_transfer_id = None  # Clear pending transfer lock
    
    def reject(self, reason=None):
        """
        Reject the transfer - product stays with original owner
        
        Args:
            reason: Optional reason for rejection
        """
        from .product import Product, ProductStatus
        
        self.status = TransferStatus.REJECTED
        self.rejection_reason = reason
        self.responded_at = datetime.utcnow()
        
        # Clear pending transfer lock on product and reset status
        product = Product.query.get(self.product_id)
        if product:
            product.pending_transfer_id = None
            # Reset product status back to a normal state (e.g., VERIFIED or IN_TRANSIT)
            if product.status == ProductStatus.PENDING_TRANSFER:
                product.status = ProductStatus.VERIFIED
    
    def cancel(self, reason=None):
        """
        Cancel the transfer (by sender) - product stays with original owner
        
        Args:
            reason: Optional reason for cancellation
        """
        from .product import Product, ProductStatus
        
        self.status = TransferStatus.CANCELLED
        self.rejection_reason = reason
        self.responded_at = datetime.utcnow()
        
        # Clear pending transfer lock on product and reset status
        product = Product.query.get(self.product_id)
        if product:
            product.pending_transfer_id = None
            # Reset product status back to a normal state
            if product.status == ProductStatus.PENDING_TRANSFER:
                product.status = ProductStatus.VERIFIED
    
    def confirm(self):
        """Legacy method - redirects to accept()"""
        self.accept(self.to_user_id)
    
    def get_claim_url(self, base_url=''):
        """Generate the URL for claiming this transfer"""
        if self.claim_token:
            return f"{base_url}/claim-transfer/{self.claim_token}"
        return None

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
        
        data = {
            'id': self.id,
            'product_id': self.product.product_id if self.product else None,
            'product': self.product.to_dict() if self.product else None,
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
            'status': self.status.value,
            'is_confirmed': self.is_confirmed,
            'confirmed_at': self.confirmed_at.isoformat() if self.confirmed_at else None,
            'rejection_reason': self.rejection_reason,
            'responded_at': self.responded_at.isoformat() if self.responded_at else None,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'has_claim_token': bool(self.claim_token),
            'claim_token_expired': self.claim_token_expires_at < datetime.utcnow() if self.claim_token_expires_at else False
        }
        
        # Include claim URL for transfers with valid claim tokens
        # This allows senders to share the claim link
        if self.claim_token and self.is_claim_token_valid():
            data['claim_url'] = self.get_claim_url()
        
        return data
    
    def __repr__(self):
        return f'<Transfer {self.id}: {self.transfer_type.value} - {self.status.value}>'


# Import timedelta for claim token expiry
from datetime import timedelta
