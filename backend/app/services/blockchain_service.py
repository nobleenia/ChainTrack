"""
Blockchain Service
Ethereum blockchain integration for product registration and tracking
"""

import os
import json
from typing import Tuple, Optional
from web3 import Web3
from eth_account import Account
from flask import current_app


class BlockchainService:
    """
    Service for interacting with Ethereum blockchain
    Handles product registration and transfer recording
    """
    
    def __init__(self):
        """Initialize blockchain connection"""
        self.rpc_url = os.environ.get('ETHEREUM_RPC_URL', '')
        self.contract_address = os.environ.get('CONTRACT_ADDRESS', '')
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
            
            # Load contract ABI if available
            if self.contract_address:
                self._load_contract()
                
        except Exception as e:
            current_app.logger.error(f"Blockchain connection failed: {e}")
            self.w3 = None
    
    def _load_contract(self):
        """Load the smart contract"""
        try:
            # Contract ABI - will be updated after deployment
            abi_path = os.path.join(
                os.path.dirname(__file__), 
                '..', '..', '..', 'contracts', 'artifacts', 
                'contracts', 'ProductRegistry.sol', 'ProductRegistry.json'
            )
            
            if os.path.exists(abi_path):
                with open(abi_path, 'r') as f:
                    contract_json = json.load(f)
                    self.contract = self.w3.eth.contract(
                        address=Web3.to_checksum_address(self.contract_address),
                        abi=contract_json['abi']
                    )
        except Exception as e:
            current_app.logger.error(f"Failed to load contract: {e}")
    
    def is_connected(self) -> bool:
        """Check if connected to blockchain"""
        return self.w3 is not None and self.w3.is_connected()
    
    def register_product(
        self, 
        product_id: str, 
        product_hash: str, 
        manufacturer_address: str
    ) -> Tuple[str, int]:
        """
        Register a product on the blockchain
        
        Args:
            product_id: Unique product identifier
            product_hash: SHA256 hash of product data
            manufacturer_address: Ethereum address of manufacturer
        
        Returns:
            Tuple of (transaction_hash, block_number)
        """
        if not self.is_connected() or not self.contract:
            # Return mock data for development
            return self._mock_transaction(product_id)
        
        try:
            # Get account from private key
            account = Account.from_key(self.private_key)
            
            # Build transaction
            nonce = self.w3.eth.get_transaction_count(account.address)
            
            # Convert product_hash to bytes32 (pad to 32 bytes if needed)
            hash_bytes = bytes.fromhex(product_hash.replace('0x', ''))
            if len(hash_bytes) < 32:
                hash_bytes = hash_bytes.ljust(32, b'\x00')
            elif len(hash_bytes) > 32:
                hash_bytes = hash_bytes[:32]
            
            tx = self.contract.functions.registerProduct(
                product_id,
                hash_bytes  # Only 2 args: productId and productHash
            ).build_transaction({
                'from': account.address,
                'nonce': nonce,
                'gas': 200000,
                'gasPrice': self.w3.eth.gas_price
            })
            
            # Sign and send transaction (web3.py 6.x uses raw_transaction instead of rawTransaction)
            signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            
            # Wait for receipt
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            return (receipt.transactionHash.hex(), receipt.blockNumber)
            
        except Exception as e:
            current_app.logger.error(f"Blockchain registration failed: {e}")
            raise
    
    def record_transfer(
        self,
        product_id: str,
        from_address: str,
        to_address: str,
        transfer_type: str,
        location: str
    ) -> Tuple[str, int]:
        """
        Record a product transfer on the blockchain
        
        Args:
            product_id: Unique product identifier
            from_address: Sender's Ethereum address
            to_address: Receiver's Ethereum address
            transfer_type: Type of transfer
            location: Current location
        
        Returns:
            Tuple of (transaction_hash, block_number)
        """
        if not self.is_connected() or not self.contract:
            return self._mock_transaction(f"{product_id}_{transfer_type}")
        
        try:
            account = Account.from_key(self.private_key)
            nonce = self.w3.eth.get_transaction_count(account.address)
            
            tx = self.contract.functions.recordTransfer(
                product_id,
                Web3.to_checksum_address(from_address),
                Web3.to_checksum_address(to_address),
                transfer_type,
                location
            ).build_transaction({
                'from': account.address,
                'nonce': nonce,
                'gas': 150000,
                'gasPrice': self.w3.eth.gas_price
            })
            
            signed_tx = self.w3.eth.account.sign_transaction(tx, self.private_key)
            tx_hash = self.w3.eth.send_raw_transaction(signed_tx.raw_transaction)
            
            receipt = self.w3.eth.wait_for_transaction_receipt(tx_hash)
            
            return (receipt.transactionHash.hex(), receipt.blockNumber)
            
        except Exception as e:
            current_app.logger.error(f"Blockchain transfer recording failed: {e}")
            raise
    
    def verify_product(self, product_id: str) -> Optional[dict]:
        """
        Verify a product on the blockchain
        
        Args:
            product_id: Unique product identifier
        
        Returns:
            Product data from blockchain or None
        """
        if not self.is_connected() or not self.contract:
            return None
        
        try:
            result = self.contract.functions.getProduct(product_id).call()
            
            return {
                'product_id': product_id,
                'product_hash': result[0].hex(),
                'manufacturer': result[1],
                'timestamp': result[2],
                'is_registered': result[3]
            }
            
        except Exception as e:
            current_app.logger.error(f"Blockchain verification failed: {e}")
            return None
    
    def get_transfer_history(self, product_id: str) -> list:
        """
        Get transfer history from blockchain
        
        Args:
            product_id: Unique product identifier
        
        Returns:
            List of transfer events
        """
        if not self.is_connected() or not self.contract:
            return []
        
        try:
            # Get transfer events for this product
            transfer_filter = self.contract.events.ProductTransferred.create_filter(
                fromBlock=0,
                argument_filters={'productId': product_id}
            )
            
            events = transfer_filter.get_all_entries()
            
            return [{
                'from': event.args['from'],
                'to': event.args['to'],
                'transfer_type': event.args['transferType'],
                'location': event.args['location'],
                'timestamp': event.args['timestamp'],
                'block_number': event.blockNumber,
                'tx_hash': event.transactionHash.hex()
            } for event in events]
            
        except Exception as e:
            current_app.logger.error(f"Failed to get transfer history: {e}")
            return []
    
    def _mock_transaction(self, data: str) -> Tuple[str, int]:
        """Generate mock transaction data for development"""
        import hashlib
        import random
        
        mock_hash = hashlib.sha256(data.encode()).hexdigest()
        mock_block = random.randint(1000000, 9999999)
        
        return (f"0x{mock_hash}", mock_block)
