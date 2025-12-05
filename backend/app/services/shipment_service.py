"""
Shipment Service
Business logic for P2P delivery/courier system
"""

import logging
from datetime import datetime
from typing import Optional, Tuple, List, Dict, Any
import hashlib
import json

from .. import db
from ..models import (
    Shipment, ShipmentCheckpoint, DeliveryProof,
    ShipmentStatus, CheckpointAction, User
)

logger = logging.getLogger(__name__)


def get_notification_service():
    """Lazy import to avoid circular dependencies"""
    from .notification_service import notification_service
    return notification_service


def get_shipment_blockchain_service():
    """Lazy import to avoid circular dependencies"""
    from .shipment_blockchain_service import get_shipment_blockchain_service as get_svc
    return get_svc()


class ShipmentService:
    """Service class for shipment operations"""

    @staticmethod
    def create_shipment(
        sender_id: int,
        receiver_name: str,
        description: str,
        pickup_address: str,
        delivery_address: str,
        receiver_email: Optional[str] = None,
        receiver_phone: Optional[str] = None,
        package_type: Optional[str] = None,
        weight: Optional[str] = None,
        dimensions: Optional[str] = None,
        declared_value: Optional[float] = None,
        special_instructions: Optional[str] = None,
        pickup_city: Optional[str] = None,
        delivery_city: Optional[str] = None,
        sender_photo_url: Optional[str] = None,
        sender_photo_ipfs_hash: Optional[str] = None,
        send_notification: bool = True,
        record_on_blockchain: bool = True
    ) -> Shipment:
        """
        Create a new shipment
        
        Returns:
            Shipment object with generated ID and PIN
        """
        sender = User.query.get(sender_id)
        sender_name = sender.name if sender else 'Sender'
        
        shipment = Shipment(
            sender_id=sender_id,
            receiver_name=receiver_name,
            receiver_email=receiver_email,
            receiver_phone=receiver_phone,
            description=description,
            package_type=package_type,
            weight=weight,
            dimensions=dimensions,
            declared_value=declared_value,
            special_instructions=special_instructions,
            pickup_address=pickup_address,
            pickup_city=pickup_city,
            delivery_address=delivery_address,
            delivery_city=delivery_city,
            sender_photo_url=sender_photo_url,
            sender_photo_ipfs_hash=sender_photo_ipfs_hash,
            status=ShipmentStatus.CREATED
        )
        
        db.session.add(shipment)
        db.session.commit()
        
        # Record on blockchain
        if record_on_blockchain:
            try:
                blockchain_svc = get_shipment_blockchain_service()
                tx_hash, block_number = blockchain_svc.register_shipment(
                    shipment_id=shipment.shipment_id,
                    sender_name=sender_name,
                    receiver_name=receiver_name,
                    origin=pickup_city or pickup_address,
                    destination=delivery_city or delivery_address
                )
                shipment.blockchain_hash = tx_hash
                shipment.blockchain_block = block_number
                db.session.commit()
                logger.info(f"Shipment {shipment.shipment_id} registered on blockchain: {tx_hash}")
            except Exception as e:
                logger.error(f"Failed to record shipment on blockchain: {e}")
        
        # Send notification to receiver
        if send_notification and (receiver_email or receiver_phone):
            try:
                notification_svc = get_notification_service()
                notification_svc.notify_shipment_created(shipment, sender_name)
            except Exception as e:
                logger.error(f"Failed to send shipment created notification: {e}")
        
        # Send in-app notification to sender
        try:
            from .in_app_notification_service import in_app_notification_service
            in_app_notification_service.shipment_status_update(
                user_id=sender_id,
                shipment_id=shipment.shipment_id,
                status='created',
                destination=delivery_city or delivery_address
            )
        except Exception as e:
            logger.error(f"Failed to send in-app shipment notification: {e}")
        
        return shipment

    @staticmethod
    def get_shipment_by_id(shipment_id: str, tracking_pin: Optional[str] = None) -> Optional[Shipment]:
        """
        Get shipment by ID, optionally verifying PIN
        
        Args:
            shipment_id: The shipment ID (e.g., SHP-A1B2C3)
            tracking_pin: Optional PIN for verification
            
        Returns:
            Shipment if found and PIN matches (if provided)
        """
        shipment = Shipment.query.filter_by(shipment_id=shipment_id).first()
        
        if not shipment:
            return None
            
        if tracking_pin and shipment.tracking_pin != tracking_pin:
            return None
            
        return shipment

    @staticmethod
    def verify_access(shipment: Shipment, user_id: Optional[int] = None, tracking_pin: Optional[str] = None) -> bool:
        """
        Verify if user/pin has access to view shipment
        
        Access granted if:
        - User is the sender
        - User is the current handler
        - Correct tracking PIN provided
        """
        if user_id:
            if shipment.sender_id == user_id:
                return True
            if shipment.current_handler_id == user_id:
                return True
                
        if tracking_pin and shipment.tracking_pin == tracking_pin:
            return True
            
        return False

    @staticmethod
    def get_user_shipments(user_id: int, role: str = 'all') -> List[Shipment]:
        """
        Get shipments for a user
        
        Args:
            user_id: User ID
            role: 'sent', 'handling', or 'all'
        """
        if role == 'sent':
            return Shipment.query.filter_by(sender_id=user_id).order_by(Shipment.created_at.desc()).all()
        elif role == 'handling':
            return Shipment.query.filter_by(current_handler_id=user_id).order_by(Shipment.created_at.desc()).all()
        else:
            # All shipments where user is sender or current handler
            return Shipment.query.filter(
                db.or_(
                    Shipment.sender_id == user_id,
                    Shipment.current_handler_id == user_id
                )
            ).order_by(Shipment.created_at.desc()).all()

    @staticmethod
    def record_checkpoint(
        shipment: Shipment,
        action: CheckpointAction,
        handler_id: Optional[int] = None,
        handler_name: Optional[str] = None,
        location: Optional[str] = None,
        notes: Optional[str] = None,
        photo_url: Optional[str] = None,
        photo_ipfs_hash: Optional[str] = None,
        send_notification: bool = True,
        record_on_blockchain: bool = True
    ) -> ShipmentCheckpoint:
        """
        Record a checkpoint/scan event
        
        Can be recorded by registered user (handler_id) or anonymous (handler_name)
        """
        checkpoint = ShipmentCheckpoint(
            shipment_id=shipment.id,
            handler_id=handler_id,
            handler_name=handler_name,
            action=action,
            location=location,
            notes=notes,
            photo_url=photo_url,
            photo_ipfs_hash=photo_ipfs_hash
        )
        
        # Update shipment status based on action
        status_map = {
            CheckpointAction.PICKED_UP: ShipmentStatus.PICKED_UP,
            CheckpointAction.CHECKPOINT: ShipmentStatus.IN_TRANSIT,
            CheckpointAction.HANDED_OFF: ShipmentStatus.IN_TRANSIT,
            CheckpointAction.OUT_FOR_DELIVERY: ShipmentStatus.OUT_FOR_DELIVERY,
            CheckpointAction.DELIVERED: ShipmentStatus.DELIVERED,
        }
        
        if action in status_map:
            shipment.status = status_map[action]
            
        # Update current handler if registered
        if handler_id:
            shipment.current_handler_id = handler_id
            
        # Update timestamps
        if action == CheckpointAction.PICKED_UP:
            shipment.picked_up_at = datetime.utcnow()
        elif action == CheckpointAction.DELIVERED:
            shipment.delivered_at = datetime.utcnow()
        
        db.session.add(checkpoint)
        db.session.commit()
        
        # Record checkpoint on blockchain
        if record_on_blockchain:
            try:
                blockchain_svc = get_shipment_blockchain_service()
                effective_handler = handler_name or (User.query.get(handler_id).name if handler_id else 'Courier')
                tx_hash, block_number = blockchain_svc.record_checkpoint(
                    shipment_id=shipment.shipment_id,
                    handler_name=effective_handler,
                    action=action.value,
                    location=location or 'Unknown',
                    ipfs_hash=photo_ipfs_hash or ''
                )
                checkpoint.blockchain_hash = tx_hash
                db.session.commit()
                logger.info(f"Checkpoint for {shipment.shipment_id} recorded on blockchain: {tx_hash}")
            except Exception as e:
                logger.error(f"Failed to record checkpoint on blockchain: {e}")
        
        # Send notifications based on action
        if send_notification:
            try:
                notification_svc = get_notification_service()
                effective_handler = handler_name or (User.query.get(handler_id).name if handler_id else 'Courier')
                
                if action == CheckpointAction.PICKED_UP:
                    notification_svc.notify_shipment_picked_up(shipment, effective_handler, location)
                elif action == CheckpointAction.OUT_FOR_DELIVERY:
                    notification_svc.notify_out_for_delivery(shipment)
                elif action == CheckpointAction.DELIVERED:
                    notification_svc.notify_shipment_delivered(shipment, effective_handler, location)
                elif action in [CheckpointAction.CHECKPOINT, CheckpointAction.HANDED_OFF]:
                    notification_svc.notify_shipment_in_transit(shipment, location or 'In transit', notes)
            except Exception as e:
                logger.error(f"Failed to send checkpoint notification: {e}")
        
        # Send in-app notifications based on action
        try:
            from .in_app_notification_service import in_app_notification_service
            status_template_map = {
                CheckpointAction.PICKED_UP: 'picked_up',
                CheckpointAction.CHECKPOINT: 'in_transit',
                CheckpointAction.HANDED_OFF: 'in_transit',
                CheckpointAction.OUT_FOR_DELIVERY: 'in_transit',
                CheckpointAction.DELIVERED: 'delivered',
            }
            template_status = status_template_map.get(action, 'in_transit')
            
            # Notify sender
            in_app_notification_service.shipment_status_update(
                user_id=shipment.sender_id,
                shipment_id=shipment.shipment_id,
                status=template_status,
                destination=shipment.delivery_city or shipment.delivery_address
            )
        except Exception as e:
            logger.error(f"Failed to send in-app checkpoint notification: {e}")
        
        return checkpoint

    @staticmethod
    def confirm_delivery(
        shipment: Shipment,
        photo_url: str,
        receiver_name: Optional[str] = None,
        receiver_relationship: Optional[str] = None,
        signature_data: Optional[str] = None,
        condition_notes: Optional[str] = None,
        photo_ipfs_hash: Optional[str] = None,
        signature_ipfs_hash: Optional[str] = None,
        send_notification: bool = True,
        record_on_blockchain: bool = True
    ) -> DeliveryProof:
        """
        Confirm delivery with proof (photo, optional signature)
        
        This is the final step - marks shipment as CONFIRMED
        """
        # Check if already confirmed
        if shipment.delivery_proof:
            raise ValueError("Delivery already confirmed")
            
        # Create delivery proof
        proof = DeliveryProof(
            shipment_id=shipment.id,
            receiver_name=receiver_name or shipment.receiver_name,
            receiver_relationship=receiver_relationship,
            photo_url=photo_url,
            photo_ipfs_hash=photo_ipfs_hash,
            signature_data=signature_data,
            condition_notes=condition_notes
        )
        
        # Update shipment status
        shipment.status = ShipmentStatus.CONFIRMED
        shipment.confirmed_at = datetime.utcnow()
        
        db.session.add(proof)
        db.session.commit()
        
        # Record confirmation on blockchain
        if record_on_blockchain:
            try:
                blockchain_svc = get_shipment_blockchain_service()
                confirmed_by = receiver_name or shipment.receiver_name
                tx_hash, block_number = blockchain_svc.confirm_delivery(
                    shipment_id=shipment.shipment_id,
                    receiver_name=confirmed_by,
                    signature_hash=signature_ipfs_hash or '',
                    photo_hash=photo_ipfs_hash or ''
                )
                proof.blockchain_hash = tx_hash
                db.session.commit()
                logger.info(f"Delivery for {shipment.shipment_id} confirmed on blockchain: {tx_hash}")
            except Exception as e:
                logger.error(f"Failed to record delivery confirmation on blockchain: {e}")
        
        # Send notification to sender
        if send_notification:
            try:
                notification_svc = get_notification_service()
                sender = User.query.get(shipment.sender_id)
                if sender and sender.email:
                    notification_svc.notify_delivery_confirmed(
                        shipment,
                        confirmed_by=receiver_name or shipment.receiver_name,
                        sender_email=sender.email
                    )
            except Exception as e:
                logger.error(f"Failed to send delivery confirmation notification: {e}")
        
        # Send in-app notification to sender
        try:
            from .in_app_notification_service import in_app_notification_service
            in_app_notification_service.shipment_status_update(
                user_id=shipment.sender_id,
                shipment_id=shipment.shipment_id,
                status='delivered',
                destination=shipment.delivery_city or shipment.delivery_address
            )
        except Exception as e:
            logger.error(f"Failed to send in-app delivery confirmation: {e}")
        
        return proof

    @staticmethod
    def cancel_shipment(shipment: Shipment, reason: Optional[str] = None) -> Shipment:
        """Cancel a shipment (only if not yet delivered)"""
        if shipment.status in [ShipmentStatus.DELIVERED, ShipmentStatus.CONFIRMED]:
            raise ValueError("Cannot cancel delivered shipment")
            
        shipment.status = ShipmentStatus.CANCELLED
        
        # Record cancellation as checkpoint
        checkpoint = ShipmentCheckpoint(
            shipment_id=shipment.id,
            action=CheckpointAction.CREATED,  # Using CREATED as placeholder
            notes=f"Shipment cancelled. Reason: {reason}" if reason else "Shipment cancelled"
        )
        
        db.session.add(checkpoint)
        db.session.commit()
        
        return shipment

    @staticmethod
    def generate_qr_data(shipment: Shipment) -> Dict[str, Any]:
        """Generate QR code data for shipment"""
        return {
            'type': 'chaintrack_shipment',
            'shipment_id': shipment.shipment_id,
            'created_at': shipment.created_at.isoformat() if shipment.created_at else None,
            'verify_url': f'https://chaintrack.io/track/{shipment.shipment_id}'
        }

    @staticmethod
    def get_tracking_info(shipment_id: str, tracking_pin: str) -> Optional[Dict[str, Any]]:
        """
        Get public tracking info (for receivers/couriers with PIN)
        
        Returns limited info without sensitive details
        """
        shipment = ShipmentService.get_shipment_by_id(shipment_id, tracking_pin)
        
        if not shipment:
            return None
            
        return {
            'shipment_id': shipment.shipment_id,
            'status': shipment.status.value,
            'description': shipment.description,
            'package_type': shipment.package_type,
            'sender_name': shipment.sender.name if shipment.sender else 'Unknown',
            'sender_photo_url': shipment.sender_photo_url,
            'receiver_name': shipment.receiver_name,
            'pickup_city': shipment.pickup_city,
            'delivery_city': shipment.delivery_city,
            'delivery_address': shipment.delivery_address,
            'special_instructions': shipment.special_instructions,
            'journey': shipment.get_journey(),
            'timestamps': {
                'created_at': shipment.created_at.isoformat() if shipment.created_at else None,
                'picked_up_at': shipment.picked_up_at.isoformat() if shipment.picked_up_at else None,
                'delivered_at': shipment.delivered_at.isoformat() if shipment.delivered_at else None,
                'confirmed_at': shipment.confirmed_at.isoformat() if shipment.confirmed_at else None
            },
            'delivery_proof': shipment.delivery_proof.to_dict() if shipment.delivery_proof else None
        }

    @staticmethod
    def get_shipment_stats(user_id: int) -> Dict[str, int]:
        """Get shipment statistics for a user"""
        sent = Shipment.query.filter_by(sender_id=user_id).count()
        sent_pending = Shipment.query.filter(
            Shipment.sender_id == user_id,
            Shipment.status.in_([ShipmentStatus.CREATED, ShipmentStatus.PICKED_UP, ShipmentStatus.IN_TRANSIT])
        ).count()
        sent_delivered = Shipment.query.filter(
            Shipment.sender_id == user_id,
            Shipment.status.in_([ShipmentStatus.DELIVERED, ShipmentStatus.CONFIRMED])
        ).count()
        handling = Shipment.query.filter_by(current_handler_id=user_id).count()
        
        return {
            'total_sent': sent,
            'pending': sent_pending,
            'delivered': sent_delivered,
            'currently_handling': handling
        }
