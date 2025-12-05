"""
Blockchain Service for ChainTrack
Handles interactions with ProductRegistry and ShipmentRegistry smart contracts on Sepolia testnet
"""

import os
import json
import logging
from datetime import datetime
from web3 import Web3
from eth_account import Account

logger = logging.getLogger(__name__)


class BlockchainService:
    """Service for interacting with ChainTrack smart contracts on Sepolia testnet"""
    
    def __init__(self, app=None):
        self.web3 = None
        self.account = None
        self.product_registry = None
        self.shipment_registry = None
        self.connected = False
        
        if app:
            self.init_app(app)
    
    def init_app(self, app):
        """Initialize the blockchain service with Flask app configuration"""
        rpc_url = app.config.get('ETHEREUM_RPC_URL') or os.environ.get('ETHEREUM_RPC_URL')
        private_key = app.config.get('PRIVATE_KEY') or os.environ.get('PRIVATE_KEY') or os.environ.get('DEPLOYER_PRIVATE_KEY')
        product_registry_address = app.config.get('PRODUCT_REGISTRY_ADDRESS') or os.environ.get('PRODUCT_REGISTRY_ADDRESS')
        shipment_registry_address = app.config.get('SHIPMENT_REGISTRY_ADDRESS') or os.environ.get('SHIPMENT_REGISTRY_ADDRESS')
        
        if not rpc_url:
            logger.warning("ETHEREUM_RPC_URL not configured. Blockchain features disabled.")
            return
        
        try:
            # Connect to Ethereum node
            self.web3 = Web3(Web3.HTTPProvider(rpc_url))
            
            if not self.web3.is_connected():
                logger.error("Failed to connect to Ethereum node")
                return
            
            logger.info(f"Connected to Ethereum network. Chain ID: {self.web3.eth.chain_id}")
            
            # Setup account for signing transactions
            if private_key:
                if not private_key.startswith('0x'):
                    private_key = '0x' + private_key
                self.account = Account.from_key(private_key)
                logger.info(f"Blockchain account configured: {self.account.address}")
            else:
                logger.warning("PRIVATE_KEY not configured. Read-only mode.")
            
            # Load ProductRegistry contract
            if product_registry_address:
                product_abi = self._load_contract_abi('ProductRegistry')
                if product_abi:
                    self.product_registry = self.web3.eth.contract(
                        address=Web3.to_checksum_address(product_registry_address),
                        abi=product_abi
                    )
                    logger.info(f"ProductRegistry loaded at {product_registry_address}")
            
            # Load ShipmentRegistry contract
            if shipment_registry_address:
                shipment_abi = self._load_contract_abi('ShipmentRegistry')
                if shipment_abi:
                    self.shipment_registry = self.web3.eth.contract(
                        address=Web3.to_checksum_address(shipment_registry_address),
                        abi=shipment_abi
                    )
                    logger.info(f"ShipmentRegistry loaded at {shipment_registry_address}")
            
            self.connected = True
            logger.info("Blockchain service initialized successfully")
            
        except Exception as e:
            logger.error(f"Failed to initialize blockchain service: {e}")
            self.connected = False
    
    def _load_contract_abi(self, contract_name):
        """Load contract ABI from artifacts directory"""
        possible_paths = [
            os.path.join(os.path.dirname(__file__), '..', '..', '..', 'contracts', 'artifacts', 'contracts', f'{contract_name}.sol', f'{contract_name}.json'),
            os.path.join('/home/noble/projects/ChainTrack', 'contracts', 'artifacts', 'contracts', f'{contract_name}.sol', f'{contract_name}.json'),
        ]
        
        for abi_path in possible_paths:
            if os.path.exists(abi_path):
                try:
                    with open(abi_path, 'r') as f:
                        artifact = json.load(f)
                        logger.info(f"Loaded ABI for {contract_name} from {abi_path}")
                        return artifact.get('abi')
                except Exception as e:
                    logger.error(f"Error loading ABI from {abi_path}: {e}")
        
        logger.warning(f"ABI not found for {contract_name}")
        return None
    
    def is_connected(self):
        """Check if the blockchain service is connected"""
        return self.connected and self.web3 and self.web3.is_connected()
    
    def _build_and_send_tx(self, tx_func, gas: int = 200000):
        """Build, sign and send a transaction"""
        if not self.account:
            raise Exception("No account configured for transactions")
        
        nonce = self.web3.eth.get_transaction_count(self.account.address)
        
        tx = tx_func.build_transaction({
            'from': self.account.address,
            'nonce': nonce,
            'gas': gas,
            'gasPrice': self.web3.eth.gas_price
        })
        
        signed_tx = self.web3.eth.account.sign_transaction(tx, self.account.key)
        tx_hash = self.web3.eth.send_raw_transaction(signed_tx.raw_transaction)
        
        receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash)
        
        # Ensure tx hash has 0x prefix
        tx_hash_hex = receipt.transactionHash.hex()
        if not tx_hash_hex.startswith('0x'):
            tx_hash_hex = '0x' + tx_hash_hex
        
        return (tx_hash_hex, receipt.blockNumber)
    
    def _mock_transaction(self, data: str):
        """Generate a mock transaction hash for development/fallback"""
        import hashlib
        mock_hash = hashlib.sha256(f"{data}:{datetime.now().isoformat()}".encode()).hexdigest()
        return (f"0x{mock_hash}", 0)
    
    def register_product(self, product_id: str, product_hash: str, manufacturer_address: str):
        """
        Register a new product on the blockchain
        
        Args:
            product_id: Unique product identifier (e.g., PRD-XXXXX)
            product_hash: SHA256 hash of product data
            manufacturer_address: Address of the manufacturer (not used in contract call but logged)
        
        Returns:
            Tuple of (transaction_hash, block_number)
        """
        if not self.is_connected() or not self.product_registry:
            logger.warning("Blockchain not connected, using mock transaction for product registration")
            return self._mock_transaction(product_id)
        
        try:
            # Convert hex string hash to bytes32
            if product_hash.startswith('0x'):
                product_hash = product_hash[2:]
            
            # Ensure hash is exactly 64 hex characters (32 bytes)
            product_hash = product_hash[:64].ljust(64, '0')
            hash_bytes = bytes.fromhex(product_hash)
            
            logger.info(f"Registering product {product_id} on blockchain...")
            
            tx_func = self.product_registry.functions.registerProduct(
                product_id,
                hash_bytes
            )
            
            result = self._build_and_send_tx(tx_func, gas=250000)
            logger.info(f"Product {product_id} registered on blockchain: {result[0]}")
            return result
            
        except Exception as e:
            logger.error(f"Blockchain product registration failed: {e}")
            raise
    
    def record_transfer(
        self, 
        product_id: str, 
        from_address: str, 
        to_address: str, 
        transfer_type: str, 
        location: str
    ):
        """
        Record a product transfer on the blockchain
        
        Args:
            product_id: Unique product identifier
            from_address: Sender's wallet address
            to_address: Receiver's wallet address
            transfer_type: Type of transfer (e.g., 'shipped', 'delivered')
            location: Current location
        
        Returns:
            Tuple of (transaction_hash, block_number)
        """
        if not self.is_connected() or not self.product_registry:
            logger.warning("Blockchain not connected, using mock transaction for transfer")
            return self._mock_transaction(f"{product_id}_{transfer_type}")
        
        try:
            # Convert addresses to checksum format
            to_addr = self.web3.to_checksum_address(to_address) if to_address != '0x0000000000000000000000000000000000000000' else to_address
            
            logger.info(f"Recording transfer for product {product_id} on blockchain...")
            
            tx_func = self.product_registry.functions.recordTransfer(
                product_id,
                to_addr,
                transfer_type,
                location
            )
            
            result = self._build_and_send_tx(tx_func, gas=250000)
            logger.info(f"Transfer for {product_id} recorded on blockchain: {result[0]}")
            return result
            
        except Exception as e:
            logger.error(f"Blockchain transfer recording failed: {e}")
            raise


# Global instance
blockchain_service = BlockchainService()
