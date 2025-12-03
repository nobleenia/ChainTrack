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


# Global instance
blockchain_service = BlockchainService()
