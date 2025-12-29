"""Simple in-memory cache for rate limiting"""
from datetime import datetime, timedelta
from typing import Optional, Any, Dict
from .config import get_settings

settings = get_settings()


class SimpleCache:
    """Simple in-memory cache with TTL"""

    def __init__(self):
        self._cache: Dict[str, tuple[Any, datetime]] = {}
        self._ttl_seconds = settings.cache_ttl_seconds

    def get(self, key: str) -> Optional[Any]:
        """Get value from cache if not expired"""
        if key in self._cache:
            value, expiry = self._cache[key]
            if datetime.utcnow() < expiry:
                return value
            else:
                # Remove expired entry
                del self._cache[key]
        return None

    def set(self, key: str, value: Any) -> None:
        """Set value in cache with TTL"""
        expiry = datetime.utcnow() + timedelta(seconds=self._ttl_seconds)
        self._cache[key] = (value, expiry)

    def delete(self, key: str) -> None:
        """Delete value from cache"""
        if key in self._cache:
            del self._cache[key]

    def clear(self) -> None:
        """Clear all cache"""
        self._cache.clear()


# Global cache instance
cache = SimpleCache()
