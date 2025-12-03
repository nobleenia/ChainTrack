"""
Courier Authorization Service
Handles courier authorization and tamper-proof checkpoint chains
"""

import hashlib
import logging
from datetime import datetime, timedelta
from typing import Optional, Tuple, List

from .. import db
from ..models import (
    Shipment, ShipmentCheckpoint, CourierAuthorization, 
    CheckpointChain, CheckpointAction, User
)

logger = logging.getLogger(__name__)


class CourierAuthorizationService:
    """
    Service for managing courier authorizations and secure checkpoint recording
    """

    @staticmethod
    def authorize_courier(
        shipment: Shipment,
        authorized_by_id: int,
        courier_user_id: Optional[int] = None,
        courier_name: Optional[str] = None,
        courier_phone: Optional[str] = None,
        can_pickup: bool = True,
        can_checkpoint: bool = True,
        can_deliver: bool = True,
        can_handoff: bool = False,
        expires_in_hours: Optional[int] = 48
    ) -> CourierAuthorization:
        """
        Authorize a courier to handle a shipment
        
        Args:
            shipment: The shipment to authorize for
            authorized_by_id: User ID of person authorizing (sender or current handler)
            courier_user_id: Registered user ID of courier (optional)
            courier_name: Name of courier if not registered
            courier_phone: Phone number for courier
            can_pickup: Allow pickup action
            can_checkpoint: Allow intermediate checkpoints
            can_deliver: Allow delivery action
            can_handoff: Allow authorizing next courier
            expires_in_hours: Hours until authorization expires (None = no expiry)
        
        Returns:
            CourierAuthorization object with auth_code
        """
        # Verify authorizer has permission
        if authorized_by_id != shipment.sender_id and authorized_by_id != shipment.current_handler_id:
            # Check if they have an active authorization with handoff permission
            existing_auth = CourierAuthorization.query.filter_by(
                shipment_id=shipment.id,
                courier_user_id=authorized_by_id,
                is_active=True
            ).first()
            
            if not existing_auth or not existing_auth.can_handoff:
                raise PermissionError("Not authorized to add couriers to this shipment")
        
        # Calculate expiration
        expires_at = None
        if expires_in_hours:
            expires_at = datetime.utcnow() + timedelta(hours=expires_in_hours)
        
        auth = CourierAuthorization(
            shipment_id=shipment.id,
            authorized_by_id=authorized_by_id,
            courier_user_id=courier_user_id,
            courier_name=courier_name,
            courier_phone=courier_phone,
            can_pickup=can_pickup,
            can_checkpoint=can_checkpoint,
            can_deliver=can_deliver,
            can_handoff=can_handoff,
            expires_at=expires_at
        )
        
        db.session.add(auth)
        db.session.commit()
        
        logger.info(f"Courier authorized for shipment {shipment.shipment_id}: {auth.auth_code}")
        return auth

    @staticmethod
    def verify_authorization(
        shipment: Shipment,
        action: str,
        auth_code: Optional[str] = None,
        user_id: Optional[int] = None
    ) -> Tuple[bool, Optional[CourierAuthorization], str]:
        """
        Verify if a courier is authorized to perform an action
        
        Args:
            shipment: The shipment
            action: Action to perform (picked_up, checkpoint, etc.)
            auth_code: Authorization code (for anonymous couriers)
            user_id: User ID (for registered couriers)
        
        Returns:
            Tuple of (is_authorized, authorization_object, error_message)
        """
        # Sender always authorized for their own shipment
        if user_id and shipment.sender_id == user_id:
            return (True, None, "Sender authorized")
        
        # Check by auth code
        if auth_code:
            auth = CourierAuthorization.query.filter_by(
                shipment_id=shipment.id,
                auth_code=auth_code
            ).first()
            
            if not auth:
                return (False, None, "Invalid authorization code")
            
            if not auth.is_valid():
                return (False, None, "Authorization expired or revoked")
            
            if not auth.can_perform_action(action):
                return (False, None, f"Not authorized for action: {action}")
            
            return (True, auth, "Authorized by code")
        
        # Check by user ID
        if user_id:
            auth = CourierAuthorization.query.filter_by(
                shipment_id=shipment.id,
                courier_user_id=user_id,
                is_active=True
            ).first()
            
            if not auth:
                return (False, None, "User not authorized for this shipment")
            
            if not auth.is_valid():
                return (False, None, "Authorization expired or revoked")
            
            if not auth.can_perform_action(action):
                return (False, None, f"Not authorized for action: {action}")
            
            return (True, auth, "Authorized by user ID")
        
        return (False, None, "No authorization provided")

    @staticmethod
    def get_shipment_authorizations(shipment_id: int) -> List[CourierAuthorization]:
        """Get all authorizations for a shipment"""
        return CourierAuthorization.query.filter_by(
            shipment_id=shipment_id
        ).order_by(CourierAuthorization.created_at.desc()).all()

    @staticmethod
    def revoke_authorization(auth_id: int, user_id: int) -> bool:
        """Revoke a courier authorization"""
        auth = CourierAuthorization.query.get(auth_id)
        if not auth:
            return False
        
        # Only sender or authorizer can revoke
        if auth.authorized_by_id != user_id and auth.shipment.sender_id != user_id:
            raise PermissionError("Not authorized to revoke this authorization")
        
        auth.revoke()
        return True


class TamperProofChainService:
    """
    Service for creating tamper-proof checkpoint chains
    Uses cryptographic hashing to detect any modifications
    """

    @staticmethod
    def compute_data_hash(checkpoint: ShipmentCheckpoint) -> str:
        """
        Compute hash of checkpoint data
        Any modification to checkpoint data would change this hash
        """
        data_string = f"{checkpoint.shipment_id}:{checkpoint.action.value}:" \
                      f"{checkpoint.handler_id or 'anon'}:{checkpoint.handler_name or ''}:" \
                      f"{checkpoint.location or ''}:{checkpoint.notes or ''}:" \
                      f"{checkpoint.photo_url or ''}:{checkpoint.timestamp.isoformat()}"
        
        return hashlib.sha256(data_string.encode()).hexdigest()

    @staticmethod
    def compute_chain_hash(sequence: int, previous_hash: str, data_hash: str) -> str:
        """
        Compute the chain hash linking to previous entry
        This creates the tamper-proof chain
        """
        chain_string = f"{sequence}:{previous_hash or 'genesis'}:{data_hash}"
        return hashlib.sha256(chain_string.encode()).hexdigest()

    @staticmethod
    def add_to_chain(checkpoint: ShipmentCheckpoint) -> CheckpointChain:
        """
        Add a checkpoint to the tamper-proof chain
        
        Args:
            checkpoint: The checkpoint to add
        
        Returns:
            The new chain entry
        """
        # Get previous chain entry for this shipment
        previous_entry = CheckpointChain.query.filter_by(
            shipment_id=checkpoint.shipment_id
        ).order_by(CheckpointChain.sequence_number.desc()).first()
        
        # Compute hashes
        sequence = (previous_entry.sequence_number + 1) if previous_entry else 1
        previous_hash = previous_entry.current_hash if previous_entry else None
        data_hash = TamperProofChainService.compute_data_hash(checkpoint)
        current_hash = TamperProofChainService.compute_chain_hash(sequence, previous_hash, data_hash)
        
        # Create chain entry
        chain_entry = CheckpointChain(
            shipment_id=checkpoint.shipment_id,
            checkpoint_id=checkpoint.id,
            sequence_number=sequence,
            previous_hash=previous_hash,
            current_hash=current_hash,
            data_hash=data_hash
        )
        
        db.session.add(chain_entry)
        db.session.commit()
        
        logger.info(f"Checkpoint #{sequence} added to chain for shipment {checkpoint.shipment_id}")
        return chain_entry

    @staticmethod
    def verify_chain_integrity(shipment_id: int) -> Tuple[bool, List[dict]]:
        """
        Verify the integrity of a shipment's checkpoint chain
        
        Returns:
            Tuple of (is_valid, list_of_verification_results)
        """
        chain_entries = CheckpointChain.query.filter_by(
            shipment_id=shipment_id
        ).order_by(CheckpointChain.sequence_number.asc()).all()
        
        if not chain_entries:
            return (True, [])
        
        results = []
        is_valid = True
        previous_hash = None
        
        for entry in chain_entries:
            # Verify chain linkage
            chain_valid = entry.previous_hash == previous_hash
            
            # Verify data integrity
            checkpoint = ShipmentCheckpoint.query.get(entry.checkpoint_id)
            if checkpoint:
                computed_data_hash = TamperProofChainService.compute_data_hash(checkpoint)
                data_valid = entry.data_hash == computed_data_hash
            else:
                data_valid = False
            
            # Verify chain hash
            computed_chain_hash = TamperProofChainService.compute_chain_hash(
                entry.sequence_number, 
                entry.previous_hash, 
                entry.data_hash
            )
            hash_valid = entry.current_hash == computed_chain_hash
            
            entry_valid = chain_valid and data_valid and hash_valid
            is_valid = is_valid and entry_valid
            
            results.append({
                'sequence': entry.sequence_number,
                'checkpoint_id': entry.checkpoint_id,
                'chain_valid': chain_valid,
                'data_valid': data_valid,
                'hash_valid': hash_valid,
                'is_valid': entry_valid,
                'blockchain_verified': entry.blockchain_hash is not None
            })
            
            previous_hash = entry.current_hash
        
        return (is_valid, results)

    @staticmethod
    def get_chain_for_shipment(shipment_id: int) -> List[dict]:
        """Get the full chain with verification status"""
        is_valid, results = TamperProofChainService.verify_chain_integrity(shipment_id)
        return {
            'is_valid': is_valid,
            'chain_length': len(results),
            'entries': results
        }
