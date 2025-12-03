"""
Courier Profile Model
For verified couriers who opt-in to track their delivery history
"""

from datetime import datetime
import secrets
import string

from .. import db


def generate_otp():
    """Generate 6-digit OTP"""
    return ''.join(secrets.choice(string.digits) for _ in range(6))


class CourierProfile(db.Model):
    """
    Profile for verified couriers
    
    Couriers can optionally create a profile to:
    - Track their delivery history
    - Build reputation scores
    - Receive notifications for new assignments
    - Access dashboard with statistics
    
    Authentication is via phone OTP only (no passwords)
    """
    __tablename__ = 'courier_profiles'

    id = db.Column(db.Integer, primary_key=True)
    
    # Identity (phone is primary, verified via OTP)
    phone = db.Column(db.String(20), unique=True, nullable=False, index=True)
    phone_verified = db.Column(db.Boolean, default=False)
    email = db.Column(db.String(120), unique=True, nullable=True)
    email_verified = db.Column(db.Boolean, default=False)
    
    # Profile info
    display_name = db.Column(db.String(100), nullable=False)
    company_name = db.Column(db.String(100), nullable=True)
    profile_photo = db.Column(db.String(500), nullable=True)
    
    # Vehicle/mode info
    vehicle_type = db.Column(db.String(50), nullable=True)  # motorcycle, van, truck, bicycle
    vehicle_plate = db.Column(db.String(20), nullable=True)
    
    # Verification status
    is_active = db.Column(db.Boolean, default=True)
    is_suspended = db.Column(db.Boolean, default=False)
    suspension_reason = db.Column(db.String(500), nullable=True)
    
    # OTP for authentication
    current_otp = db.Column(db.String(6), nullable=True)
    otp_created_at = db.Column(db.DateTime, nullable=True)
    otp_attempts = db.Column(db.Integer, default=0)
    
    # Statistics (auto-calculated)
    total_deliveries = db.Column(db.Integer, default=0)
    successful_deliveries = db.Column(db.Integer, default=0)
    total_checkpoints = db.Column(db.Integer, default=0)
    on_time_deliveries = db.Column(db.Integer, default=0)
    average_rating = db.Column(db.Float, default=0.0)
    total_ratings = db.Column(db.Integer, default=0)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
    last_active_at = db.Column(db.DateTime, nullable=True)
    verified_since = db.Column(db.DateTime, nullable=True)
    
    # Blockchain tracking
    total_blockchain_records = db.Column(db.Integer, default=0)
    last_blockchain_tx = db.Column(db.String(100), nullable=True)

    def __repr__(self):
        return f'<CourierProfile {self.display_name} ({self.phone})>'

    def generate_new_otp(self):
        """Generate new OTP for authentication"""
        self.current_otp = generate_otp()
        self.otp_created_at = datetime.utcnow()
        self.otp_attempts = 0
        db.session.commit()
        return self.current_otp
    
    def verify_otp(self, otp: str) -> bool:
        """Verify OTP and return True if valid"""
        if not self.current_otp or not self.otp_created_at:
            return False
        
        # Check expiration (10 minutes)
        elapsed = (datetime.utcnow() - self.otp_created_at).total_seconds()
        if elapsed > 600:
            return False
        
        # Check attempts (max 3)
        if self.otp_attempts >= 3:
            return False
        
        self.otp_attempts += 1
        
        if self.current_otp == otp:
            self.current_otp = None
            self.otp_created_at = None
            self.otp_attempts = 0
            
            if not self.phone_verified:
                self.phone_verified = True
                self.verified_since = datetime.utcnow()
            
            self.last_active_at = datetime.utcnow()
            db.session.commit()
            return True
        
        db.session.commit()
        return False

    @property
    def on_time_percentage(self):
        """Calculate on-time delivery percentage"""
        if self.successful_deliveries == 0:
            return 100.0
        return round((self.on_time_deliveries / self.successful_deliveries) * 100, 1)
    
    @property
    def success_rate(self):
        """Calculate delivery success rate"""
        if self.total_deliveries == 0:
            return 100.0
        return round((self.successful_deliveries / self.total_deliveries) * 100, 1)

    def record_delivery(self, successful: bool, on_time: bool = True):
        """Record a completed delivery"""
        self.total_deliveries += 1
        if successful:
            self.successful_deliveries += 1
            if on_time:
                self.on_time_deliveries += 1
        db.session.commit()
    
    def record_checkpoint(self):
        """Record a checkpoint"""
        self.total_checkpoints += 1
        self.last_active_at = datetime.utcnow()
        db.session.commit()
    
    def add_rating(self, rating: float):
        """Add a rating (1-5)"""
        if rating < 1 or rating > 5:
            return
        
        total = self.average_rating * self.total_ratings
        self.total_ratings += 1
        self.average_rating = round((total + rating) / self.total_ratings, 2)
        db.session.commit()
    
    def record_blockchain_tx(self, tx_hash: str):
        """Record blockchain transaction"""
        self.total_blockchain_records += 1
        self.last_blockchain_tx = tx_hash
        db.session.commit()

    def to_dict(self, include_stats=True):
        """Convert to dictionary for API response"""
        data = {
            'id': self.id,
            'phone': self.phone,
            'phone_verified': self.phone_verified,
            'email': self.email,
            'display_name': self.display_name,
            'company_name': self.company_name,
            'profile_photo': self.profile_photo,
            'vehicle_type': self.vehicle_type,
            'is_active': self.is_active,
            'is_suspended': self.is_suspended,
            'created_at': self.created_at.isoformat(),
            'verified_since': self.verified_since.isoformat() if self.verified_since else None,
            'last_active_at': self.last_active_at.isoformat() if self.last_active_at else None
        }
        
        if include_stats:
            data['stats'] = {
                'total_deliveries': self.total_deliveries,
                'successful_deliveries': self.successful_deliveries,
                'total_checkpoints': self.total_checkpoints,
                'on_time_percentage': self.on_time_percentage,
                'success_rate': self.success_rate,
                'average_rating': self.average_rating,
                'total_ratings': self.total_ratings,
                'total_blockchain_records': self.total_blockchain_records
            }
        
        return data


class CourierSession(db.Model):
    """
    Session tokens for authenticated couriers
    """
    __tablename__ = 'courier_sessions'
    
    id = db.Column(db.Integer, primary_key=True)
    courier_id = db.Column(db.Integer, db.ForeignKey('courier_profiles.id'), nullable=False)
    
    # Session token (UUID-like)
    token = db.Column(db.String(64), unique=True, nullable=False, index=True)
    
    # Device info
    device_info = db.Column(db.String(500), nullable=True)
    ip_address = db.Column(db.String(50), nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    expires_at = db.Column(db.DateTime, nullable=False)
    last_used_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Status
    is_active = db.Column(db.Boolean, default=True)
    
    # Relationships
    courier = db.relationship('CourierProfile', backref='sessions')
    
    @staticmethod
    def generate_token():
        """Generate secure session token"""
        return secrets.token_hex(32)
    
    def is_valid(self):
        """Check if session is valid"""
        if not self.is_active:
            return False
        if datetime.utcnow() > self.expires_at:
            return False
        return True
    
    def refresh(self):
        """Refresh session timestamp"""
        self.last_used_at = datetime.utcnow()
        db.session.commit()


class CourierActivity(db.Model):
    """
    Log of courier activities for audit trail
    Recorded on-chain for verified couriers
    """
    __tablename__ = 'courier_activities'
    
    id = db.Column(db.Integer, primary_key=True)
    
    # Link to courier (optional - can be anonymous)
    courier_profile_id = db.Column(db.Integer, db.ForeignKey('courier_profiles.id'), nullable=True)
    courier_auth_id = db.Column(db.Integer, db.ForeignKey('courier_authorizations.id'), nullable=True)
    
    # Shipment reference
    shipment_id = db.Column(db.Integer, db.ForeignKey('shipments.id'), nullable=False)
    checkpoint_id = db.Column(db.Integer, db.ForeignKey('shipment_checkpoints.id'), nullable=True)
    
    # Activity details
    activity_type = db.Column(db.String(50), nullable=False)  # auth_used, checkpoint, pickup, delivery
    action = db.Column(db.String(50), nullable=True)
    location = db.Column(db.String(200), nullable=True)
    notes = db.Column(db.String(500), nullable=True)
    
    # Device/location data
    device_info = db.Column(db.String(500), nullable=True)
    ip_address = db.Column(db.String(50), nullable=True)
    gps_latitude = db.Column(db.Float, nullable=True)
    gps_longitude = db.Column(db.Float, nullable=True)
    
    # Blockchain record
    blockchain_tx_hash = db.Column(db.String(100), nullable=True)
    blockchain_block = db.Column(db.Integer, nullable=True)
    
    # Timestamps
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    
    # Relationships
    courier_profile = db.relationship('CourierProfile', backref='activities')
    courier_auth = db.relationship('CourierAuthorization', backref='activities')
    shipment = db.relationship('Shipment', backref='courier_activities')
    checkpoint = db.relationship('ShipmentCheckpoint', backref='courier_activity')

    def to_dict(self):
        return {
            'id': self.id,
            'courier': {
                'profile_id': self.courier_profile_id,
                'auth_id': self.courier_auth_id,
                'name': self.courier_profile.display_name if self.courier_profile else 
                        (self.courier_auth.courier_name if self.courier_auth else 'Unknown')
            },
            'shipment_id': self.shipment_id,
            'activity_type': self.activity_type,
            'action': self.action,
            'location': self.location,
            'gps': {
                'latitude': self.gps_latitude,
                'longitude': self.gps_longitude
            } if self.gps_latitude else None,
            'blockchain': {
                'tx_hash': self.blockchain_tx_hash,
                'block': self.blockchain_block
            } if self.blockchain_tx_hash else None,
            'created_at': self.created_at.isoformat()
        }
