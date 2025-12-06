"""
Token Service
Handles CTK token claims and blockchain interactions for reward tokens
"""

import os
import json
import logging
from typing import Optional, Tuple
from web3 import Web3
from eth_account import Account

from .. import db
from ..models import User, UserRewards, PointTransaction, PointActionType

logger = logging.getLogger(__name__)

# Token contract ABI (minimal - only what we need)
TOKEN_ABI = [
    {
        "inputs": [
            {"name": "to", "type": "address"},
            {"name": "points", "type": "uint256"}
        ],
        "name": "claimTokens",
        "outputs": [],
        "stateMutability": "nonpayable",
        "type": "function"
    },
    {
        "inputs": [{"name": "user", "type": "address"}],
        "name": "getClaimedPoints",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "points", "type": "uint256"}],
        "name": "calculateTokens",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "pure",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "POINTS_PER_TOKEN",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [{"name": "account", "type": "address"}],
        "name": "balanceOf",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    },
    {
        "inputs": [],
        "name": "totalSupply",
        "outputs": [{"name": "", "type": "uint256"}],
        "stateMutability": "view",
        "type": "function"
    }
]


class TokenService:
    """Service for managing CTK token claims"""
    
    _instance = None
    
    def __new__(cls):
        if cls._instance is None:
            cls._instance = super().__new__(cls)
            cls._instance._initialized = False
        return cls._instance
    
    def __init__(self):
        if self._initialized:
            return
            
        self.web3 = None
        self.contract = None
        self.account = None
        self.contract_address = None
        self.points_per_token = 100  # Default, will be read from contract
        
        self._initialize()
        self._initialized = True
    
    def _initialize(self):
        """Initialize Web3 and contract connection"""
        try:
            # Get configuration from environment
            rpc_url = os.getenv('ETHEREUM_RPC_URL') or os.getenv('SEPOLIA_RPC_URL')
            private_key = os.getenv('ETHEREUM_PRIVATE_KEY')
            self.contract_address = os.getenv('CHAINTRACK_TOKEN_ADDRESS')
            
            if not rpc_url:
                logger.warning("No ETHEREUM_RPC_URL configured. Token service disabled.")
                return
            
            if not self.contract_address:
                logger.warning("No CHAINTRACK_TOKEN_ADDRESS configured. Token service disabled.")
                return
            
            # Connect to Ethereum
            self.web3 = Web3(Web3.HTTPProvider(rpc_url))
            
            if not self.web3.is_connected():
                logger.error("Failed to connect to Ethereum network")
                return
            
            logger.info(f"Connected to Ethereum. Chain ID: {self.web3.eth.chain_id}")
            
            # Load contract
            self.contract = self.web3.eth.contract(
                address=Web3.to_checksum_address(self.contract_address),
                abi=TOKEN_ABI
            )
            logger.info(f"ChainTrackToken loaded at {self.contract_address}")
            
            # Load account for signing transactions
            if private_key:
                self.account = Account.from_key(private_key)
                logger.info(f"Token minter account: {self.account.address}")
            else:
                logger.warning("No ETHEREUM_PRIVATE_KEY configured. Cannot mint tokens.")
            
            # Read points per token from contract
            try:
                self.points_per_token = self.contract.functions.POINTS_PER_TOKEN().call()
                logger.info(f"Points per token: {self.points_per_token}")
            except Exception as e:
                logger.warning(f"Could not read POINTS_PER_TOKEN from contract: {e}")
                
        except Exception as e:
            logger.error(f"Token service initialization failed: {e}")
    
    def is_available(self) -> bool:
        """Check if token service is available"""
        return self.web3 is not None and self.contract is not None and self.account is not None
    
    def get_token_balance(self, wallet_address: str) -> Optional[int]:
        """Get CTK token balance for a wallet address"""
        if not self.contract:
            return None
        
        try:
            checksum_address = Web3.to_checksum_address(wallet_address)
            balance_wei = self.contract.functions.balanceOf(checksum_address).call()
            # Convert from wei (18 decimals) to whole tokens
            return balance_wei // (10 ** 18)
        except Exception as e:
            logger.error(f"Error getting token balance: {e}")
            return None
    
    def get_claimed_points(self, wallet_address: str) -> Optional[int]:
        """Get total points claimed by a wallet address"""
        if not self.contract:
            return None
        
        try:
            checksum_address = Web3.to_checksum_address(wallet_address)
            return self.contract.functions.getClaimedPoints(checksum_address).call()
        except Exception as e:
            logger.error(f"Error getting claimed points: {e}")
            return None
    
    def calculate_tokens_for_points(self, points: int) -> int:
        """Calculate how many tokens a given number of points yields"""
        return points // self.points_per_token
    
    def calculate_claimable_tokens(self, user_id: int) -> Tuple[int, int]:
        """
        Calculate how many tokens a user can claim
        
        Returns:
            Tuple of (claimable_points, claimable_tokens)
        """
        user_rewards = UserRewards.query.filter_by(user_id=user_id).first()
        if not user_rewards:
            return (0, 0)
        
        # Available points = total earned - already claimed
        available_points = user_rewards.total_points - user_rewards.claimed_points
        
        # Calculate whole tokens (no partial tokens)
        claimable_tokens = available_points // self.points_per_token
        claimable_points = claimable_tokens * self.points_per_token
        
        return (claimable_points, claimable_tokens)
    
    def claim_tokens(self, user_id: int, wallet_address: str) -> Tuple[bool, str, Optional[str]]:
        """
        Claim tokens for a user by minting to their wallet
        
        Args:
            user_id: User's database ID
            wallet_address: User's Ethereum wallet address
            
        Returns:
            Tuple of (success, message, transaction_hash)
        """
        if not self.is_available():
            return (False, "Token service is not available", None)
        
        # Validate wallet address
        try:
            checksum_address = Web3.to_checksum_address(wallet_address)
        except Exception:
            return (False, "Invalid wallet address", None)
        
        # Get user rewards
        user_rewards = UserRewards.query.filter_by(user_id=user_id).first()
        if not user_rewards:
            return (False, "No rewards found for this user", None)
        
        # Calculate claimable
        claimable_points, claimable_tokens = self.calculate_claimable_tokens(user_id)
        
        if claimable_tokens == 0:
            return (False, f"Not enough points to claim. Need at least {self.points_per_token} points.", None)
        
        try:
            # Build the transaction
            nonce = self.web3.eth.get_transaction_count(self.account.address)
            
            tx = self.contract.functions.claimTokens(
                checksum_address,
                claimable_points
            ).build_transaction({
                'from': self.account.address,
                'nonce': nonce,
                'gas': 150000,
                'gasPrice': self.web3.eth.gas_price,
                'chainId': self.web3.eth.chain_id
            })
            
            # Sign and send
            signed_tx = self.web3.eth.account.sign_transaction(tx, self.account.key)
            tx_hash = self.web3.eth.send_raw_transaction(signed_tx.raw_transaction)
            tx_hash_hex = tx_hash.hex()
            
            logger.info(f"Token claim submitted. TX: {tx_hash_hex}")
            
            # Wait for confirmation
            receipt = self.web3.eth.wait_for_transaction_receipt(tx_hash, timeout=120)
            
            if receipt['status'] != 1:
                return (False, "Transaction failed on blockchain", tx_hash_hex)
            
            # Update database
            user_rewards.claimed_points += claimable_points
            user_rewards.token_balance += claimable_tokens
            
            # Record the transaction
            claim_tx = PointTransaction(
                user_id=user_id,
                action=PointActionType.TOKEN_CLAIM,
                points=-claimable_points,  # Negative because points are being claimed
                description=f"Claimed {claimable_tokens} CTK tokens",
                reference_type='token_claim',
                reference_id=tx_hash_hex
            )
            db.session.add(claim_tx)
            db.session.commit()
            
            logger.info(f"User {user_id} claimed {claimable_tokens} CTK tokens. TX: {tx_hash_hex}")
            
            return (
                True, 
                f"Successfully claimed {claimable_tokens} CTK tokens!", 
                tx_hash_hex
            )
            
        except Exception as e:
            db.session.rollback()
            logger.error(f"Token claim failed: {e}")
            return (False, f"Token claim failed: {str(e)}", None)
    
    def get_token_info(self) -> dict:
        """Get general token information"""
        if not self.contract:
            return {
                'available': False,
                'message': 'Token service not configured'
            }
        
        try:
            total_supply = self.contract.functions.totalSupply().call()
            return {
                'available': True,
                'contract_address': self.contract_address,
                'name': 'ChainTrack Token',
                'symbol': 'CTK',
                'decimals': 18,
                'points_per_token': self.points_per_token,
                'total_supply': total_supply // (10 ** 18),
                'total_supply_wei': str(total_supply),
                'network': 'sepolia' if self.web3.eth.chain_id == 11155111 else 'unknown'
            }
        except Exception as e:
            logger.error(f"Error getting token info: {e}")
            return {
                'available': False,
                'message': str(e)
            }


# Singleton instance
token_service = TokenService()
