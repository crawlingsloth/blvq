"""Ewity API client with caching"""
import httpx
from typing import Optional, List, Dict, Any
from .config import get_settings
from .cache import cache

settings = get_settings()


class EwityClient:
    """Client for Ewity POS API"""

    def __init__(self):
        self.base_url = settings.ewity_api_base_url
        self.headers = {"Authorization": f"Bearer {settings.ewity_api_token}"}

    async def _get(self, endpoint: str, params: Optional[Dict] = None) -> Dict[str, Any]:
        """Make GET request to Ewity API"""
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{self.base_url}{endpoint}",
                headers=self.headers,
                params=params,
                timeout=10.0
            )
            response.raise_for_status()
            return response.json()

    async def get_customer(self, customer_id: int) -> Optional[Dict[str, Any]]:
        """Get customer by ID with caching"""
        cache_key = f"customer:{customer_id}"

        # Check cache first
        cached = cache.get(cache_key)
        if cached:
            return cached

        # Fetch all customers and find the one we want
        # Note: Ewity doesn't have a single customer endpoint, so we need to search
        try:
            data = await self._get("/customers", params={"pageSize": 100})
            customers = data.get("data", [])

            # Search through customers
            for customer in customers:
                if customer.get("id") == customer_id:
                    cache.set(cache_key, customer)
                    return customer

            # If not found in first page, we might need pagination
            # For now, return None
            return None
        except Exception as e:
            print(f"Error fetching customer {customer_id}: {e}")
            return None

    async def search_customers(self, query: str, page: int = 1) -> Dict[str, Any]:
        """Search customers by name or phone"""
        cache_key = f"search:{query}:{page}"

        # Check cache
        cached = cache.get(cache_key)
        if cached:
            return cached

        try:
            # Fetch customers and filter locally
            # Note: Ewity API might not have search, so we fetch and filter
            data = await self._get("/customers", params={"page": page, "pageSize": 50})

            # Filter results by query (name or mobile)
            query_lower = query.lower()
            customers = data.get("data", [])
            filtered = [
                c for c in customers
                if (c.get("name") and query_lower in c.get("name", "").lower()) or
                   (c.get("mobile") and query in c.get("mobile", ""))
            ]

            result = {
                "data": filtered,
                "pagination": data.get("pagination", {})
            }

            cache.set(cache_key, result)
            return result
        except Exception as e:
            print(f"Error searching customers: {e}")
            return {"data": [], "pagination": {}}

    async def get_all_customers(self, page: int = 1) -> Dict[str, Any]:
        """Get all customers with caching"""
        cache_key = f"customers:page:{page}"

        cached = cache.get(cache_key)
        if cached:
            return cached

        try:
            data = await self._get("/customers", params={"page": page, "pageSize": 20})
            cache.set(cache_key, data)
            return data
        except Exception as e:
            print(f"Error fetching customers: {e}")
            return {"data": [], "pagination": {}}


# Global client instance
ewity_client = EwityClient()
