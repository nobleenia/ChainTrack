"""
Shipment Models
P2P Delivery/Courier tracking system
Supports flexible delivery flow with optional intermediate checkpoints
"""

from datetime import datetime
from enum import Enum
import secrets
import string

from .. import db


class ShipmentStatus(Enum):
    """Shipment status throughout delivery journey"""
    CREATED = 'created'           # Sender created, waiting for pickup
    PICKED_UP = 'picked_up'       # Courier picked up
    IN_TRANSIT = 'in_transit'     # Moving between checkpoints
    OUT_FOR_DELIVERY = 'out_for_delivery'  # Final leg to receiver
    DELIVERED = 'delivered'       # Handed to receiver
    CONFIRMED = 'confirmed'       # Receiver confirmed receipt
    CANCELLED = 'cancelled'       # Shipment cancelled


class CheckpointAction(Enum):
    """Types of checkpoint events"""
    CREATED = 'created'           # Shipment created by sender
    PICKED_UP = 'picked_up'       # Picked up from sender
    CHECKPOINT = 'checkpoint'     # Intermediate scan (hub, transit point)
    HANDED_OFF = 'handed_off'     # Transferred to another courier
    OUT_FOR_DELIVERY = 'out_for_delivery'  # On final delivery route
    DELIVERED = 'delivered'       # Delivered to receiver location
    CONFIRMED = 'confirmed'       # Receiver confirmed with photo/signature


def generate_shipment_id():
    """Generate unique shipment ID like SHP-A1B2C3"""
    chars = string.ascii_uppercase + string.digits
    code = ''.join(secrets.choice(chars) for _ in range(6))
    return f"SHP-{code}"


def generate_tracking_pin():
    """Generate 6-digit PIN for tracking access"""
    return ''.join(secrets.choice(string.digits) for _ in range(6))


class Shipment(db.Model):
    """
    Main shipment record
    Tracks package from sender to receiver with blockchain verification
    """
    __tablename__ = 'shipments'

    id = db.Column(db.Integer, primary_key=True)
    shipment_id = db.Column(db.String(20), unique=True, nullable=False, default=generate_shipment_id)
    
    # Security - PIN for tracking access
    tracking_pin = db.Column(db.String(10), nullable=False, default=generate_tracking_pin)
    
    # Sender info (registered user)
    sender_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=False)
    sender = db.relationship('User', foreign_keys=[sender_id], backref='sent_shipments')
    
    # Receiver info (may not be registered)
    receiver_name = db.Column(db.String(100), nullable=False)
    receiver_email = db.Column(db.String(120), nullable=True)
    receiver_phone = db.Column(db.String(20), nullable=True)
    
    # Package details
    description = db.Column(db.Text, nullable=False)
    package_type = db.Column(db.String(50), nullable=True)  # e.g., "Food", "Electronics", "Documents"
    weight = db.Column(db.String(20), nullable=True)  # e.g., "2kg"
    dimensions = db.Column(db.String(50), nullable=True)  # e.g., "30x20x10cm"
    declared_value = db.Column(db.Float, nullable=True)  # Optional value declaration
    special_instructions = db.Column(db.Text, nullable=True)
    
    # Locations
    pickup_address = db.Column(db.Text, nullable=False)
    pickup_city = db.Column(db.String(100), nullable=True)
    delivery_address = db.Column(db.Text, nullable=False)
    delivery_city = db.Column(db.String(100), nullable=True)
    
    # Sender's photo of item (required)
    sender_photo_url = db.Column(db.String(500), nullable=True)
    sender_photo_ipfs_hash = db.Column(db.String(100), nullable=True)
    
    # Status
    status = db.Column(db.Enum(ShipmentStatus), default=ShipmentStatus.CREATED, nullable=False)
    
    # Current handler (courier) - nullable, updated as package moves
    current_handler_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    current_handler = db.relationship('User', foreign_keys=[current_handler_id])
    
    # Blockchain
    blockchain_hash = db.Column(db.String(100), nullable=True)
    blockchain_block = db.Column(db.Integer, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    picked_up_at = db.Column(db.DateTime, nullable=True)
    delivered_at = db.Column(db.DateTime, nullable=True)
    confirmed_at = db.Column(db.DateTime, nullable=True)
    
    # Relationships
    checkpoints = db.relationship('ShipmentCheckpoint', backref='shipment', lazy='dynamic', 
                                   order_by='ShipmentCheckpoint.timestamp')
    delivery_proof = db.relationship('DeliveryProof', backref='shipment', uselist=False)

    def __repr__(self):
        return f'<Shipment {self.shipment_id}>'

    def to_dict(self, include_pin=False, include_checkpoints=True):
        """Convert to dictionary for API response"""
        data = {
            'id': self.id,
            'shipment_id': self.shipment_id,
            'status': self.status.value,
            'sender': {
                'id': self.sender.id,
                'name': self.sender.name,
                'email': self.sender.email
            } if self.sender else None,
            'receiver': {
                'name': self.receiver_name,
                'email': self.receiver_email,
                'phone': self.receiver_phone
            },
            'package': {
                'description': self.description,
                'type': self.package_type,
                'weight': self.weight,
                'dimensions': self.dimensions,
                'declared_value': self.declared_value,
                'special_instructions': self.special_instructions
            },
            'pickup': {
                'address': self.pickup_address,
                'city': self.pickup_city
            },
            'delivery': {
                'address': self.delivery_address,
                'city': self.delivery_city
            },
            'sender_photo': {
                'url': self.sender_photo_url,
                'ipfs_hash': self.sender_photo_ipfs_hash
            },
            'current_handler': {
                'id': self.current_handler.id,
                'name': self.current_handler.name
            } if self.current_handler else None,
            'blockchain': {
                'hash': self.blockchain_hash,
                'block': self.blockchain_block
            },
            'timestamps': {
                'created_at': self.created_at.isoformat() if self.created_at else None,
                'updated_at': self.updated_at.isoformat() if self.updated_at else None,
                'picked_up_at': self.picked_up_at.isoformat() if self.picked_up_at else None,
                'delivered_at': self.delivered_at.isoformat() if self.delivered_at else None,
                'confirmed_at': self.confirmed_at.isoformat() if self.confirmed_at else None
            }
        }
        
        if include_pin:
            data['tracking_pin'] = self.tracking_pin
            
        if include_checkpoints:
            data['checkpoints'] = [cp.to_dict() for cp in self.checkpoints.all()]
            
        if self.delivery_proof:
            data['delivery_proof'] = self.delivery_proof.to_dict()
            
        return data

    def get_journey(self):
        """Get full journey timeline"""
        journey = []
        
        # Add creation event
        journey.append({
            'action': CheckpointAction.CREATED.value,
            'actor': self.sender.name if self.sender else 'Unknown',
            'location': self.pickup_address,
            'timestamp': self.created_at.isoformat() if self.created_at else None,
            'photo_url': self.sender_photo_url,
            'notes': 'Package created and ready for pickup'
        })
        
        # Add all checkpoints
        for checkpoint in self.checkpoints.all():
            journey.append(checkpoint.to_dict())
        
        # Add delivery proof if exists
        if self.delivery_proof:
            journey.append({
                'action': CheckpointAction.CONFIRMED.value,
                'actor': self.delivery_proof.receiver_name or self.receiver_name,
                'location': self.delivery_address,
                'timestamp': self.delivery_proof.confirmed_at.isoformat() if self.delivery_proof.confirmed_at else None,
                'photo_url': self.delivery_proof.photo_url,
                'notes': 'Delivery confirmed by receiver',
                'has_signature': bool(self.delivery_proof.signature_data)
            })
        
        return journey


class ShipmentCheckpoint(db.Model):
    """
    Checkpoint/scan event during shipment journey
    Optional - shipments can go directly from sender to receiver
    """
    __tablename__ = 'shipment_checkpoints'

    id = db.Column(db.Integer, primary_key=True)
    shipment_id = db.Column(db.Integer, db.ForeignKey('shipments.id'), nullable=False)
    
    # Who recorded this checkpoint (optional - could be anonymous courier)
    handler_id = db.Column(db.Integer, db.ForeignKey('users.id'), nullable=True)
    handler = db.relationship('User', backref='handled_checkpoints')
    handler_name = db.Column(db.String(100), nullable=True)  # For non-registered handlers
    
    # Checkpoint details
    action = db.Column(db.Enum(CheckpointAction), nullable=False)
    location = db.Column(db.String(200), nullable=True)
    notes = db.Column(db.Text, nullable=True)
    
    # Photo (optional for intermediate checkpoints)
    photo_url = db.Column(db.String(500), nullable=True)
    photo_ipfs_hash = db.Column(db.String(100), nullable=True)
    
    # Blockchain
    blockchain_hash = db.Column(db.String(100), nullable=True)
    
    # Timestamp
    timestamp = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<Checkpoint {self.id} - {self.action.value}>'

    def to_dict(self):
        return {
            'id': self.id,
            'action': self.action.value,
            'actor': self.handler.name if self.handler else (self.handler_name or 'Unknown'),
            'actor_id': self.handler_id,
            'location': self.location,
            'notes': self.notes,
            'photo_url': self.photo_url,
            'photo_ipfs_hash': self.photo_ipfs_hash,
            'blockchain_hash': self.blockchain_hash,
            'timestamp': self.timestamp.isoformat() if self.timestamp else None
        }


class DeliveryProof(db.Model):
    """
    Final delivery confirmation by receiver
    Includes photo of received package and optional signature
    """
    __tablename__ = 'delivery_proofs'

    id = db.Column(db.Integer, primary_key=True)
    shipment_id = db.Column(db.Integer, db.ForeignKey('shipments.id'), nullable=False, unique=True)
    
    # Who received (might be different from intended receiver)
    receiver_name = db.Column(db.String(100), nullable=True)
    receiver_relationship = db.Column(db.String(50), nullable=True)  # e.g., "Self", "Family member", "Security"
    
    # Photo proof (required)
    photo_url = db.Column(db.String(500), nullable=False)
    photo_ipfs_hash = db.Column(db.String(100), nullable=True)
    
    # Digital signature (optional but recommended)
    signature_data = db.Column(db.Text, nullable=True)  # Base64 encoded signature image
    
    # Condition notes
    condition_notes = db.Column(db.Text, nullable=True)  # e.g., "Package intact", "Slight damage"
    
    # Blockchain
    blockchain_hash = db.Column(db.String(100), nullable=True)
    
    # Timestamp
    confirmed_at = db.Column(db.DateTime, default=datetime.utcnow)

    def __repr__(self):
        return f'<DeliveryProof {self.id} for Shipment {self.shipment_id}>'

    def to_dict(self):
        return {
            'id': self.id,
            'receiver_name': self.receiver_name,
            'receiver_relationship': self.receiver_relationship,
            'photo_url': self.photo_url,
            'photo_ipfs_hash': self.photo_ipfs_hash,
            'has_signature': bool(self.signature_data),
            'condition_notes': self.condition_notes,
            'blockchain_hash': self.blockchain_hash,
            'confirmed_at': self.confirmed_at.isoformat() if self.confirmed_at else None
        }
