"""
Courier Authorization Model
Manages authorized couriers/handlers for shipments
"""

from datetime import datetime
import secrets
import string

from .. import db


def generate_courier_code():
    """Generate unique courier authorization code"""
    chars = string.ascii_uppercase + string.digits
    return ''.join(secrets.choice(chars) for _ in range(8))


class CourierAuthorization(db.Model):
    """
    Tracks which couriers/handlers are authorized for a shipment
    
    Authorization Flow:
    1. Sender creates shipment
    2. Sender authorizes a courier (by user_id or generates a code)
    3. Courier uses authorization to add checkpoints
    4. Each handoff requires new authorization
    """
    __tablename__ = 'courier_authorizations'

    id = db.Column(db.Integer, primary_key=True)
    shipment_id = db.Column(db.Integer, db.ForeignKey('shipments.id'), nullable=False)
    
    # Who authorized this courier
    authorized_by_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    
    # The authorized courier (can be registered user or anonymous)
    courier_user_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    courier_name = db.Column(db.String(100), nullable=True)  # For non-registered couriers
    courier_phone = db.Column(db.String(20), nullable=True)
    
    # Authorization code (for anonymous couriers)
    auth_code = db.Column(db.String(20), unique=True, nullable=False, default=generate_courier_code)
    
    # Authorization scope
    can_pickup = db.Column(db.Boolean, default=True)
    can_checkpoint = db.Column(db.Boolean, default=True)
    can_deliver = db.Column(db.Boolean, default=True)
    can_handoff = db.Column(db.Boolean, default=True)  # Can authorize next courier
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    activated_at = db.Column(db.DateTime, nullable=True)  # When courier first used the code
    revoked_at = db.Column(db.DateTime, nullable=True)
    
    # Tracking
    checkpoints_recorded = db.Column(db.Integer, default=0)
    last_action_at = db.Column(db.DateTime, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=True)  # Optional expiration
    
    # Relationships
    shipment = db.relationship('Shipment', backref='courier_authorizations')
    authorized_by = db.relationship('User', foreign_keys=[authorized_by_id])
    courier_user = db.relationship('User', foreign_keys=[courier_user_id])

    def __repr__(self):
        return f'<CourierAuth {self.auth_code} for Shipment {self.shipment_id}>'

    def is_valid(self):
        """Check if authorization is currently valid"""
        if not self.is_active:
            return False
        if self.revoked_at:
            return False
        if self.expires_at and datetime.utcnow() > self.expires_at:
            return False
        return True

    def can_perform_action(self, action: str) -> bool:
        """Check if this authorization allows specific action"""
        if not self.is_valid():
            return False
            
        action_map = {
            'picked_up': self.can_pickup,
            'checkpoint': self.can_checkpoint,
            'in_transit': self.can_checkpoint,
            'out_for_delivery': self.can_deliver,
            'delivered': self.can_deliver,
            'handed_off': self.can_handoff
        }
        return action_map.get(action, False)

    def record_usage(self):
        """Record that this authorization was used"""
        if not self.activated_at:
            self.activated_at = datetime.utcnow()
        self.last_action_at = datetime.utcnow()
        self.checkpoints_recorded += 1
        db.session.commit()

    def revoke(self):
        """Revoke this authorization"""
        self.is_active = False
        self.revoked_at = datetime.utcnow()
        db.session.commit()

    def to_dict(self, include_code=False):
        """Convert to dictionary for API response"""
        data = {
            'id': self.id,
            'shipment_id': self.shipment_id,
            'courier': {
                'user_id': self.courier_user_id,
                'name': self.courier_name or (self.courier_user.name if self.courier_user else None),
                'phone': self.courier_phone
            },
            'permissions': {
                'can_pickup': self.can_pickup,
                'can_checkpoint': self.can_checkpoint,
                'can_deliver': self.can_deliver,
                'can_handoff': self.can_handoff
            },
            'status': {
                'is_active': self.is_active,
                'is_valid': self.is_valid(),
                'activated_at': self.activated_at.isoformat() if self.activated_at else None,
                'expires_at': self.expires_at.isoformat() if self.expires_at else None
            },
            'usage': {
                'checkpoints_recorded': self.checkpoints_recorded,
                'last_action_at': self.last_action_at.isoformat() if self.last_action_at else None
            },
            'created_at': self.created_at.isoformat()
        }
        
        if include_code:
            data['auth_code'] = self.auth_code
            
        return data


class CheckpointChain(db.Model):
    """
    Tamper-proof chain linking checkpoints
    Each checkpoint includes hash of previous, creating immutable sequence
    """
    __tablename__ = 'checkpoint_chains'
    
    id = db.Column(db.Integer, primary_key=True)
    shipment_id = db.Column(db.Integer, db.ForeignKey('shipments.id'), nullable=False)
    checkpoint_id = db.Column(db.Integer, db.ForeignKey('shipment_checkpoints.id'), nullable=False)
    
    # Chain integrity
    sequence_number = db.Column(db.Integer, nullable=False)  # Position in chain
    previous_hash = db.Column(db.String(64), nullable=True)  # Hash of previous entry (None for first)
    current_hash = db.Column(db.String(64), nullable=False)  # Hash of this entry
    
    # Data that was hashed
    data_hash = db.Column(db.String(64), nullable=False)  # Hash of checkpoint data
    
    # Blockchain reference (if recorded on-chain)
    blockchain_hash = db.Column(db.String(100), nullable=True)
    blockchain_block = db.Column(db.Integer, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    shipment = db.relationship('Shipment', backref='checkpoint_chain')
    checkpoint = db.relationship('ShipmentCheckpoint', backref='chain_entry')
    
    def __repr__(self):
        return f'<ChainEntry #{self.sequence_number} for Shipment {self.shipment_id}>'

    def to_dict(self):
        return {
            'sequence': self.sequence_number,
            'previous_hash': self.previous_hash,
            'current_hash': self.current_hash,
            'data_hash': self.data_hash,
            'blockchain': {
                'hash': self.blockchain_hash,
                'block': self.blockchain_block
            } if self.blockchain_hash else None,
            'created_at': self.created_at.isoformat()
        }
