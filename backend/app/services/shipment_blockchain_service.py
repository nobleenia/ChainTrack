"""
Shipment Blockchain Service
Ethereum blockchain integration for P2P shipment tracking
"""

import os
import json
import hashlib
import random
from typing import Tuple, Optional, List, Dict
from web3 import Web3
from eth_account import Account
from flask import current_app


class ShipmentBlockchainService:
    """
    Service for interacting with ShipmentRegistry smart contract
    Handles shipment registration, checkpoints, and delivery confirmation
    """
    
    def __init__(self):
        """Initialize blockchain connection"""
        self.rpc_url = os.environ.get('ETHEREUM_RPC_URL', '')
        self.contract_address = os.environ.get('SHIPMENT_REGISTRY_ADDRESS', '')
        self.private_key = os.environ.get('DEPLOYER_PRIVATE_KEY', '')
        
        self.w3 = None
        self.contract = None
        
        if self.rpc_url:
            self._connect()
    
    def _connect(self):
        """Establish connection to Ethereum network"""
        try:
            self.w3 = Web3(Web3.HTTPProvider(self.rpc_url))
            
            if not self.w3.is_connected():
                raise ConnectionError("Failed to connect to Ethereum network")
            
            if self.contract_address:
                self._load_contract()
                
        except Exception as e:
            if current_app:
                current_app.logger.error(f"Blockchain connection failed: {e}")
            self.w3 = None
    
    def _load_contract(self):
        """Load the ShipmentRegistry contract"""
        try:
            abi_path = os.path.join(
                os.path.dirname(__file__), 
                '..', '..', '..', 'contracts', 'artifacts', 
                'contracts', 'ShipmentRegistry.sol', 'ShipmentRegistry.json'
            )
            
            if os.path.exists(abi_path):
                with open(abi_path, 'r') as f:
                    contract_json = json.load(f)
                    self.contract = self.w3.eth.contract(
                        address=Web3.to_checksum_address(self.contract_address),
                        abi=contract_json['abi']
                    )
        except Exception as e:
            if current_app:
                current_app.logger.error(f"Failed to load contract: {e}")
    
    def is_connected(self) -> bool:
        """Check if connected to blockchain"""
        return self.w3 is not None and self.w3.is_connected()
    
    def _get_account(self):
        """Get account from private key"""
        return Account.from_key(self.private_key)
    
    def _build_and_send_tx(self, tx_func, gas: int = 200000) -> Tuple[str, int]:
        """Build, sign and send a transaction"""
        account = self._get_account()
        nonce = self.w3.eth.get_transaction_count(account.address)
        
        tx = tx_func.build_transaction({
            'from': account.address,
            'nonce': nonce,
            'gas': gas,
            'gasPrice': self.w3.eth.gas_price
        })
        
        signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
        tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
        
        receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
        
        return (receipt.transactionHash.hex(), receipt.blockNumber)
    
    def register_shipment(
        self, 
        shipment_id: str,
        sender_name: str,
        receiver_name: str,
        origin: str,
        destination: str
    ) -> Tuple[str, int]:
        """
        Register a new shipment on the blockchain
        
        Args:
            shipment_id: Unique shipment identifier (e.g., SHP-XXXXX)
            sender_name: Name of the sender
            receiver_name: Name of the receiver
            origin: Origin location
            destination: Destination location
        
        Returns:
            Tuple of (transaction_hash, block_number)
        """
        if not self.is_connected() or not self.contract:
            return self._mock_transaction(shipment_id)
        
        try:
            # Create shipment hash from data
            data_string = f"{shipment_id}:{sender_name}:{receiver_name}:{origin}:{destination}"
            shipment_hash = hashlib.sha256(data_string.encode()).digest()
            
            # Pad or truncate to 32 bytes
            if len(shipment_hash) < 32:
                shipment_hash = shipment_hash.ljust(32, b'\x00')
            elif len(shipment_hash) > 32:
                shipment_hash = shipment_hash[:32]
            
            tx_func = self.contract.functions.registerShipment(
                shipment_id,
                shipment_hash,
                origin,
                destination
            )
            
            return self._build_and_send_tx(tx_func, gas=250000)
            
        except Exception as e:
            if current_app:
                current_app.logger.error(f"Blockchain shipment registration failed: {e}")
            raise
    
    def record_checkpoint(
        self,
        shipment_id: str,
        handler_name: str,
        action: str,
        location: str,
        ipfs_hash: str = ""
    ) -> Tuple[str, int]:
        """
        Record a checkpoint for a shipment on the blockchain
        
        Args:
            shipment_id: Unique shipment identifier
            handler_name: Name of person handling the shipment
            action: Action taken (e.g., "picked_up", "in_transit", "at_checkpoint")
            location: Current location
            ipfs_hash: Optional IPFS hash of proof photo
        
        Returns:
            Tuple of (transaction_hash, block_number)
        """
        if not self.is_connected() or not self.contract:
            return self._mock_transaction(f"{shipment_id}_{action}")
        
        try:
            tx_func = self.contract.functions.recordCheckpoint(
                shipment_id,
                action,
                handler_name,
                location,
                ipfs_hash
            )
            
            return self._build_and_send_tx(tx_func, gas=200000)
            
        except Exception as e:
            if current_app:
                current_app.logger.error(f"Blockchain checkpoint recording failed: {e}")
            raise
    
    def confirm_delivery(
        self,
        shipment_id: str,
        receiver_name: str,
        signature_hash: str = "",
        photo_hash: str = ""
    ) -> Tuple[str, int]:
        """
        Confirm delivery of a shipment on the blockchain
        
        Args:
            shipment_id: Unique shipment identifier
            receiver_name: Name of the receiver
            signature_hash: IPFS hash of signature image
            photo_hash: IPFS hash of proof of delivery photo
        
        Returns:
            Tuple of (transaction_hash, block_number)
        """
        if not self.is_connected() or not self.contract:
            return self._mock_transaction(f"{shipment_id}_delivered")
        
        try:
            tx_func = self.contract.functions.confirmDelivery(
                shipment_id,
                receiver_name,
                photo_hash,
                signature_hash
            )
            
            return self._build_and_send_tx(tx_func, gas=250000)
            
        except Exception as e:
            if current_app:
                current_app.logger.error(f"Blockchain delivery confirmation failed: {e}")
            raise
    
    def get_shipment(self, shipment_id: str) -> Optional[Dict]:
        """
        Get shipment data from the blockchain
        
        Args:
            shipment_id: Unique shipment identifier
        
        Returns:
            Shipment data or None
        """
        if not self.is_connected() or not self.contract:
            return None
        
        try:
            result = self.contract.functions.getShipment(shipment_id).call()
            
            # Map status enum to string
            status_map = {0: 'registered', 1: 'in_transit', 2: 'delivered', 3: 'confirmed'}
            
            return {
                'shipment_id': shipment_id,
                'shipment_hash': result[0].hex() if isinstance(result[0], bytes) else result[0],
                'sender': result[1],
                'created_at': result[2],
                'status': status_map.get(result[3], 'unknown'),
                'checkpoint_count': result[4]
            }
            
        except Exception as e:
            if current_app:
                current_app.logger.error(f"Failed to get shipment: {e}")
            return None
    
    def get_checkpoints(self, shipment_id: str) -> List[Dict]:
        """
        Get all checkpoints for a shipment from the blockchain
        
        Args:
            shipment_id: Unique shipment identifier
        
        Returns:
            List of checkpoint data
        """
        if not self.is_connected() or not self.contract:
            return []
        
        try:
            # First get checkpoint count
            shipment = self.get_shipment(shipment_id)
            if not shipment:
                return []
            
            checkpoints = []
            for i in range(shipment['checkpoint_count']):
                checkpoint = self.contract.functions.getCheckpoint(shipment_id, i).call()
                checkpoints.append({
                    'index': i,
                    'handler': checkpoint[0],
                    'action': checkpoint[1],
                    'location': checkpoint[2],
                    'timestamp': checkpoint[3],
                    'ipfs_hash': checkpoint[4]
                })
            
            return checkpoints
            
        except Exception as e:
            if current_app:
                current_app.logger.error(f"Failed to get checkpoints: {e}")
            return []
    
    def get_delivery_proof(self, shipment_id: str) -> Optional[Dict]:
        """
        Get delivery proof from the blockchain
        
        Args:
            shipment_id: Unique shipment identifier
        
        Returns:
            Delivery proof data or None
        """
        if not self.is_connected() or not self.contract:
            return None
        
        try:
            result = self.contract.functions.getDeliveryProof(shipment_id).call()
            
            return {
                'shipment_id': shipment_id,
                'receiver_hash': result[0].hex() if isinstance(result[0], bytes) else result[0],
                'signature_hash': result[1],
                'photo_hash': result[2],
                'confirmed_at': result[3]
            }
            
        except Exception as e:
            if current_app:
                current_app.logger.error(f"Failed to get delivery proof: {e}")
            return None
    
    def get_shipment_events(self, shipment_id: str) -> List[Dict]:
        """
        Get all blockchain events for a shipment
        
        Args:
            shipment_id: Unique shipment identifier
        
        Returns:
            List of events
        """
        if not self.is_connected() or not self.contract:
            return []
        
        events = []
        
        try:
            # Get ShipmentRegistered events
            reg_filter = self.contract.events.ShipmentRegistered.create_filter(
                fromBlock=0,
                argument_filters={'shipmentId': shipment_id}
            )
            for event in reg_filter.get_all_entries():
                events.append({
                    'type': 'registered',
                    'shipment_id': event.args['shipmentId'],
                    'sender': event.args['sender'],
                    'timestamp': event.args['timestamp'],
                    'block_number': event.blockNumber,
                    'tx_hash': event.transactionHash.hex()
                })
            
            # Get CheckpointRecorded events
            checkpoint_filter = self.contract.events.CheckpointRecorded.create_filter(
                fromBlock=0,
                argument_filters={'shipmentId': shipment_id}
            )
            for event in checkpoint_filter.get_all_entries():
                events.append({
                    'type': 'checkpoint',
                    'shipment_id': event.args['shipmentId'],
                    'handler': event.args['handler'],
                    'action': event.args['action'],
                    'location': event.args['location'],
                    'timestamp': event.args['timestamp'],
                    'block_number': event.blockNumber,
                    'tx_hash': event.transactionHash.hex()
                })
            
            # Get DeliveryConfirmed events
            delivery_filter = self.contract.events.DeliveryConfirmed.create_filter(
                fromBlock=0,
                argument_filters={'shipmentId': shipment_id}
            )
            for event in delivery_filter.get_all_entries():
                events.append({
                    'type': 'delivered',
                    'shipment_id': event.args['shipmentId'],
                    'timestamp': event.args['timestamp'],
                    'block_number': event.blockNumber,
                    'tx_hash': event.transactionHash.hex()
                })
            
            # Sort by timestamp
            events.sort(key=lambda x: x.get('timestamp', 0))
            
            return events
            
        except Exception as e:
            if current_app:
                current_app.logger.error(f"Failed to get events: {e}")
            return []
    
    def _mock_transaction(self, data: str) -> Tuple[str, int]:
        """Generate mock transaction data for development"""
        mock_hash = hashlib.sha256(data.encode()).hexdigest()
        mock_block = random.randint(1000000, 9999999)
        
        return (f"0x{mock_hash}", mock_block)


# Singleton instance
_shipment_blockchain_service = None

def get_shipment_blockchain_service() -> ShipmentBlockchainService:
    """Get or create singleton instance of ShipmentBlockchainService"""
    global _shipment_blockchain_service
    if _shipment_blockchain_service is None:
        _shipment_blockchain_service = ShipmentBlockchainService()
    return _shipment_blockchain_service
