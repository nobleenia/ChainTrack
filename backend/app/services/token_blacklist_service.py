"""
Token Blacklist Service
Production-ready JWT token revocation using Redis

This service handles:
- Token blacklisting on logout
- Token validation checks
- Automatic expiry of blacklisted tokens
- Fallback to in-memory storage if Redis unavailable
"""

import os
import logging
from datetime import datetime, timedelta
from typing import Optional

logger = logging.getLogger(__name__)

# Redis client (initialized lazily)
_redis_client = None
_redis_available = None

# Fallback in-memory storage (for development/testing)
_memory_blacklist = {}


def _get_redis_client():
    """
    Get or create Redis client connection.
    Returns None if Redis is not available.
    """
    global _redis_client, _redis_available
    
    # Return cached result
    if _redis_available is False:
        return None
    if _redis_client is not None:
        return _redis_client
    
    redis_url = os.environ.get('REDIS_URL')
    
    if not redis_url:
        logger.info("REDIS_URL not set. Using in-memory token blacklist (not recommended for production)")
        _redis_available = False
        return None
    
    try:
        import redis
        _redis_client = redis.from_url(redis_url, decode_responses=True)
        # Test connection
        _redis_client.ping()
        _redis_available = True
        logger.info("Connected to Redis for token blacklist")
        return _redis_client
    except ImportError:
        logger.warning("redis package not installed. Using in-memory token blacklist")
        _redis_available = False
        return None
    except Exception as e:
        logger.warning(f"Could not connect to Redis: {e}. Using in-memory token blacklist")
        _redis_available = False
        return None


def _get_blacklist_key(jti: str) -> str:
    """Generate Redis key for a token JTI"""
    return f"chaintrack:token_blacklist:{jti}"


def add_token_to_blacklist(jti: str, expires_in_seconds: int = 86400) -> bool:
    """
    Add a token to the blacklist.
    
    Args:
        jti: The JWT ID (unique identifier for the token)
        expires_in_seconds: How long to keep in blacklist (default 24h)
                          Should match your longest token expiry
    
    Returns:
        True if successfully blacklisted, False otherwise
    """
    redis_client = _get_redis_client()
    
    if redis_client:
        try:
            key = _get_blacklist_key(jti)
            # Store with expiry so Redis auto-cleans old entries
            redis_client.setex(key, expires_in_seconds, datetime.utcnow().isoformat())
            logger.debug(f"Token {jti[:8]}... blacklisted in Redis")
            return True
        except Exception as e:
            logger.error(f"Failed to blacklist token in Redis: {e}")
            # Fall through to memory storage
    
    # Fallback to in-memory
    expiry_time = datetime.utcnow() + timedelta(seconds=expires_in_seconds)
    _memory_blacklist[jti] = expiry_time
    logger.debug(f"Token {jti[:8]}... blacklisted in memory")
    
    # Clean up expired entries periodically (simple approach)
    _cleanup_memory_blacklist()
    
    return True


def is_token_blacklisted(jti: str) -> bool:
    """
    Check if a token is blacklisted.
    
    Args:
        jti: The JWT ID to check
    
    Returns:
        True if blacklisted, False otherwise
    """
    redis_client = _get_redis_client()
    
    if redis_client:
        try:
            key = _get_blacklist_key(jti)
            return redis_client.exists(key) > 0
        except Exception as e:
            logger.error(f"Failed to check token blacklist in Redis: {e}")
            # Fall through to memory check
    
    # Check in-memory fallback
    if jti in _memory_blacklist:
        if _memory_blacklist[jti] > datetime.utcnow():
            return True
        else:
            # Expired, remove it
            del _memory_blacklist[jti]
    
    return False


def revoke_all_user_tokens(user_id: int, token_version: int = None) -> bool:
    """
    Revoke all tokens for a user (e.g., on password change).
    
    This is implemented by storing a "revoked before" timestamp.
    Any token issued before this timestamp is considered invalid.
    
    Args:
        user_id: The user's ID
        token_version: Optional version number to increment
    
    Returns:
        True if successful
    """
    redis_client = _get_redis_client()
    
    key = f"chaintrack:user_token_revoked:{user_id}"
    revoked_at = datetime.utcnow().isoformat()
    
    if redis_client:
        try:
            # Store for 30 days (refresh token lifetime)
            redis_client.setex(key, 30 * 24 * 3600, revoked_at)
            logger.info(f"Revoked all tokens for user {user_id}")
            return True
        except Exception as e:
            logger.error(f"Failed to revoke user tokens: {e}")
    
    # For memory fallback, we can't easily revoke all tokens
    # This is a limitation of the in-memory approach
    logger.warning(f"Cannot revoke all tokens for user {user_id} without Redis")
    return False


def is_token_revoked_for_user(user_id: int, token_issued_at: datetime) -> bool:
    """
    Check if a token was issued before the user's tokens were revoked.
    
    Args:
        user_id: The user's ID
        token_issued_at: When the token was issued (from JWT 'iat' claim)
    
    Returns:
        True if token should be considered revoked
    """
    redis_client = _get_redis_client()
    
    if not redis_client:
        return False  # Can't check without Redis
    
    try:
        key = f"chaintrack:user_token_revoked:{user_id}"
        revoked_at_str = redis_client.get(key)
        
        if revoked_at_str:
            revoked_at = datetime.fromisoformat(revoked_at_str)
            return token_issued_at < revoked_at
    except Exception as e:
        logger.error(f"Failed to check user token revocation: {e}")
    
    return False


def _cleanup_memory_blacklist():
    """Remove expired entries from in-memory blacklist"""
    now = datetime.utcnow()
    expired = [jti for jti, expiry in _memory_blacklist.items() if expiry <= now]
    for jti in expired:
        del _memory_blacklist[jti]
    
    if expired:
        logger.debug(f"Cleaned up {len(expired)} expired blacklist entries")


def get_blacklist_stats() -> dict:
    """Get statistics about the token blacklist (for monitoring)"""
    redis_client = _get_redis_client()
    
    stats = {
        'storage': 'redis' if redis_client else 'memory',
        'redis_available': _redis_available,
    }
    
    if redis_client:
        try:
            # Count blacklisted tokens (approximate)
            cursor = 0
            count = 0
            while True:
                cursor, keys = redis_client.scan(cursor, match="chaintrack:token_blacklist:*", count=100)
                count += len(keys)
                if cursor == 0:
                    break
            stats['blacklisted_tokens'] = count
        except Exception as e:
            stats['error'] = str(e)
    else:
        _cleanup_memory_blacklist()
        stats['blacklisted_tokens'] = len(_memory_blacklist)
    
    return stats
