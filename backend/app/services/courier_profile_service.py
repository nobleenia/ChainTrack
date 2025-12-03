"""
Courier Profile Service
Handles courier registration, authentication, and activity tracking with blockchain integration
"""

import logging
from datetime import datetime, timedelta
from typing import Optional, Tuple, List, Dict

from .. import db
from ..models import (
    CourierProfile, CourierSession, CourierActivity,
    CourierAuthorization, Shipment, ShipmentCheckpoint
)
from .shipment_blockchain_service import get_shipment_blockchain_service

logger = logging.getLogger(__name__)


class CourierProfileService:
    """
    Service for managing courier profiles and authentication
    """

    @staticmethod
    def create_profile(
        phone: str,
        display_name: str,
        company_name: Optional[str] = None,
        email: Optional[str] = None,
        vehicle_type: Optional[str] = None
    ) -> CourierProfile:
        """
        Create a new courier profile
        
        Args:
            phone: Phone number (primary identifier)
            display_name: Courier's display name
            company_name: Optional company name
            email: Optional email address
            vehicle_type: Optional vehicle type
        
        Returns:
            New CourierProfile
        """
        # Check if phone already exists
        existing = CourierProfile.query.filter_by(phone=phone).first()
        if existing:
            raise ValueError("Phone number already registered")
        
        profile = CourierProfile(
            phone=phone,
            display_name=display_name,
            company_name=company_name,
            email=email,
            vehicle_type=vehicle_type
        )
        
        db.session.add(profile)
        db.session.commit()
        
        logger.info(f"Created courier profile for {phone}")
        return profile

    @staticmethod
    def get_by_phone(phone: str) -> Optional[CourierProfile]:
        """Get courier profile by phone number"""
        return CourierProfile.query.filter_by(phone=phone).first()

    @staticmethod
    def get_by_id(profile_id: int) -> Optional[CourierProfile]:
        """Get courier profile by ID"""
        return CourierProfile.query.get(profile_id)

    @staticmethod
    def request_otp(phone: str, display_name: Optional[str] = None) -> Tuple[bool, str, Optional[str]]:
        """
        Request OTP for authentication
        Creates profile if doesn't exist
        
        Args:
            phone: Phone number
            display_name: Name (required if new profile)
        
        Returns:
            Tuple of (success, message, otp_for_dev_only)
        """
        profile = CourierProfile.query.filter_by(phone=phone).first()
        
        if not profile:
            if not display_name:
                return (False, "New profile requires display_name", None)
            
            profile = CourierProfile(
                phone=phone,
                display_name=display_name
            )
            db.session.add(profile)
        
        otp = profile.generate_new_otp()
        
        # In production, send OTP via SMS
        # For development, we return it (REMOVE IN PRODUCTION)
        logger.info(f"OTP generated for {phone}: {otp}")
        
        # TODO: Integrate SMS service (Twilio, etc.)
        # sms_service.send(phone, f"Your ChainTrack verification code is: {otp}")
        
        return (True, "OTP sent successfully", otp)

    @staticmethod
    def verify_otp_and_login(
        phone: str, 
        otp: str,
        device_info: Optional[str] = None,
        ip_address: Optional[str] = None
    ) -> Tuple[bool, str, Optional[Dict]]:
        """
        Verify OTP and create session
        
        Args:
            phone: Phone number
            otp: OTP to verify
            device_info: Device information
            ip_address: Client IP address
        
        Returns:
            Tuple of (success, message, session_data)
        """
        profile = CourierProfile.query.filter_by(phone=phone).first()
        
        if not profile:
            return (False, "Profile not found", None)
        
        if profile.is_suspended:
            return (False, "Account suspended", None)
        
        if not profile.verify_otp(otp):
            return (False, "Invalid or expired OTP", None)
        
        # Create session
        session = CourierSession(
            courier_id=profile.id,
            token=CourierSession.generate_token(),
            device_info=device_info,
            ip_address=ip_address,
            expires_at=datetime.utcnow() + timedelta(days=30)
        )
        
        db.session.add(session)
        db.session.commit()
        
        return (True, "Login successful", {
            'token': session.token,
            'expires_at': session.expires_at.isoformat(),
            'profile': profile.to_dict()
        })

    @staticmethod
    def verify_session(token: str) -> Tuple[bool, Optional[CourierProfile]]:
        """
        Verify session token
        
        Returns:
            Tuple of (is_valid, courier_profile)
        """
        session = CourierSession.query.filter_by(token=token, is_active=True).first()
        
        if not session or not session.is_valid():
            return (False, None)
        
        session.refresh()
        return (True, session.courier)

    @staticmethod
    def logout(token: str) -> bool:
        """Invalidate session"""
        session = CourierSession.query.filter_by(token=token).first()
        if session:
            session.is_active = False
            db.session.commit()
            return True
        return False

    @staticmethod
    def update_profile(
        profile_id: int,
        display_name: Optional[str] = None,
        company_name: Optional[str] = None,
        email: Optional[str] = None,
        vehicle_type: Optional[str] = None,
        vehicle_plate: Optional[str] = None,
        profile_photo: Optional[str] = None
    ) -> Optional[CourierProfile]:
        """Update courier profile"""
        profile = CourierProfile.query.get(profile_id)
        if not profile:
            return None
        
        if display_name:
            profile.display_name = display_name
        if company_name is not None:
            profile.company_name = company_name
        if email is not None:
            profile.email = email
        if vehicle_type is not None:
            profile.vehicle_type = vehicle_type
        if vehicle_plate is not None:
            profile.vehicle_plate = vehicle_plate
        if profile_photo is not None:
            profile.profile_photo = profile_photo
        
        db.session.commit()
        return profile


class CourierActivityService:
    """
    Service for tracking and recording courier activities
    All activities are logged and can be recorded on blockchain
    """

    @staticmethod
    def record_activity(
        shipment: Shipment,
        activity_type: str,
        action: Optional[str] = None,
        location: Optional[str] = None,
        notes: Optional[str] = None,
        courier_profile: Optional[CourierProfile] = None,
        courier_auth: Optional[CourierAuthorization] = None,
        checkpoint: Optional[ShipmentCheckpoint] = None,
        device_info: Optional[str] = None,
        ip_address: Optional[str] = None,
        gps_coords: Optional[Tuple[float, float]] = None,
        record_on_chain: bool = True
    ) -> CourierActivity:
        """
        Record courier activity with optional blockchain recording
        
        Args:
            shipment: Related shipment
            activity_type: Type of activity (auth_used, checkpoint, pickup, delivery)
            action: Specific action taken
            location: Location string
            notes: Additional notes
            courier_profile: Verified courier profile (if logged in)
            courier_auth: Authorization used (for anonymous couriers)
            checkpoint: Related checkpoint (if any)
            device_info: Device information
            ip_address: Client IP
            gps_coords: Tuple of (latitude, longitude)
            record_on_chain: Whether to record on blockchain
        
        Returns:
            CourierActivity record
        """
        activity = CourierActivity(
            shipment_id=shipment.id,
            courier_profile_id=courier_profile.id if courier_profile else None,
            courier_auth_id=courier_auth.id if courier_auth else None,
            checkpoint_id=checkpoint.id if checkpoint else None,
            activity_type=activity_type,
            action=action,
            location=location,
            notes=notes,
            device_info=device_info,
            ip_address=ip_address,
            gps_latitude=gps_coords[0] if gps_coords else None,
            gps_longitude=gps_coords[1] if gps_coords else None
        )
        
        db.session.add(activity)
        db.session.commit()
        
        # Record on blockchain if enabled
        if record_on_chain:
            try:
                tx_hash, block_num = CourierActivityService._record_on_blockchain(
                    shipment=shipment,
                    activity=activity,
                    courier_name=courier_profile.display_name if courier_profile else 
                                (courier_auth.courier_name if courier_auth else 'Anonymous')
                )
                
                activity.blockchain_tx_hash = tx_hash
                activity.blockchain_block = block_num
                db.session.commit()
                
                # Update courier profile stats
                if courier_profile:
                    courier_profile.record_blockchain_tx(tx_hash)
                
                logger.info(f"Activity recorded on blockchain: {tx_hash}")
                
            except Exception as e:
                logger.error(f"Failed to record activity on blockchain: {e}")
                # Continue without blockchain - activity is still recorded locally
        
        # Update courier stats
        if courier_profile:
            if activity_type == 'checkpoint':
                courier_profile.record_checkpoint()
            elif activity_type == 'delivery' and action == 'delivered':
                courier_profile.record_delivery(successful=True)
        
        # Update authorization usage
        if courier_auth:
            courier_auth.record_usage()
        
        return activity

    @staticmethod
    def _record_on_blockchain(
        shipment: Shipment,
        activity: CourierActivity,
        courier_name: str
    ) -> Tuple[str, int]:
        """
        Record activity on blockchain
        
        Returns:
            Tuple of (transaction_hash, block_number)
        """
        blockchain_service = get_shipment_blockchain_service()
        
        if not blockchain_service.is_connected():
            raise ConnectionError("Blockchain not connected")
        
        # Record as checkpoint on blockchain
        tx_hash, block_num = blockchain_service.record_checkpoint(
            shipment_id=shipment.shipment_id,
            handler_name=courier_name,
            action=activity.action or activity.activity_type,
            location=activity.location or "Unknown",
            ipfs_hash=""  # Could store photo hash here
        )
        
        return (tx_hash, block_num)

    @staticmethod
    def get_courier_activities(
        courier_profile_id: int,
        limit: int = 50,
        offset: int = 0
    ) -> List[CourierActivity]:
        """Get activities for a verified courier"""
        return CourierActivity.query.filter_by(
            courier_profile_id=courier_profile_id
        ).order_by(
            CourierActivity.created_at.desc()
        ).limit(limit).offset(offset).all()

    @staticmethod
    def get_shipment_courier_activities(shipment_id: int) -> List[CourierActivity]:
        """Get all courier activities for a shipment"""
        return CourierActivity.query.filter_by(
            shipment_id=shipment_id
        ).order_by(CourierActivity.created_at.asc()).all()


class CourierShipmentService:
    """
    Service for couriers to access their assigned shipments
    """

    @staticmethod
    def get_assigned_shipments(
        courier_profile_id: Optional[int] = None,
        courier_phone: Optional[str] = None,
        status: Optional[str] = None
    ) -> List[Dict]:
        """
        Get shipments assigned to a courier
        
        Args:
            courier_profile_id: Verified courier profile ID
            courier_phone: Phone number (for matching authorizations)
            status: Filter by shipment status
        
        Returns:
            List of shipment data with authorization info
        """
        query = CourierAuthorization.query.filter(
            CourierAuthorization.is_active == True
        )
        
        if courier_profile_id:
            # Find by linked user or phone match
            profile = CourierProfile.query.get(courier_profile_id)
            if profile:
                query = query.filter(
                    db.or_(
                        CourierAuthorization.courier_user_id == courier_profile_id,
                        CourierAuthorization.courier_phone == profile.phone
                    )
                )
        elif courier_phone:
            query = query.filter(CourierAuthorization.courier_phone == courier_phone)
        else:
            return []
        
        authorizations = query.all()
        
        results = []
        for auth in authorizations:
            if not auth.is_valid():
                continue
            
            shipment = auth.shipment
            
            # Apply status filter
            if status and shipment.status.value != status:
                continue
            
            results.append({
                'shipment': {
                    'id': shipment.id,
                    'shipment_id': shipment.shipment_id,
                    'status': shipment.status.value,
                    'origin': shipment.origin,
                    'destination': shipment.destination,
                    'created_at': shipment.created_at.isoformat(),
                    'estimated_delivery': shipment.estimated_delivery.isoformat() if shipment.estimated_delivery else None
                },
                'authorization': auth.to_dict(include_code=True),
                'checkpoints_count': len(shipment.checkpoints)
            })
        
        return results

    @staticmethod
    def get_courier_stats(courier_profile_id: int) -> Dict:
        """Get statistics for a verified courier"""
        profile = CourierProfile.query.get(courier_profile_id)
        if not profile:
            return {}
        
        # Get active assignments
        active_auths = CourierAuthorization.query.filter(
            db.or_(
                CourierAuthorization.courier_user_id == courier_profile_id,
                CourierAuthorization.courier_phone == profile.phone
            ),
            CourierAuthorization.is_active == True
        ).count()
        
        # Get recent activities
        recent_activities = CourierActivity.query.filter_by(
            courier_profile_id=courier_profile_id
        ).order_by(
            CourierActivity.created_at.desc()
        ).limit(5).all()
        
        return {
            'profile': profile.to_dict(include_stats=True),
            'active_assignments': active_auths,
            'recent_activities': [a.to_dict() for a in recent_activities]
        }

    @staticmethod
    def link_authorization_to_profile(
        auth_code: str,
        courier_profile_id: int
    ) -> bool:
        """
        Link an authorization code to a verified courier profile
        This auto-associates future uses of this code with the profile
        
        Args:
            auth_code: Authorization code
            courier_profile_id: Courier profile to link
        
        Returns:
            Success status
        """
        auth = CourierAuthorization.query.filter_by(auth_code=auth_code).first()
        profile = CourierProfile.query.get(courier_profile_id)
        
        if not auth or not profile:
            return False
        
        # Link profile phone to authorization
        if not auth.courier_phone and profile.phone:
            auth.courier_phone = profile.phone
        
        # If courier_name not set, use profile name
        if not auth.courier_name:
            auth.courier_name = profile.display_name
        
        db.session.commit()
        return True
