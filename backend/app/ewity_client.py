"""Ewity API client with caching"""
import httpx
import json
from datetime import datetime
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
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

    async def search_customers(self, query: str, page: int = 1, db: Optional[Session] = None) -> Dict[str, Any]:
        """Search customers by name or phone from local database"""
        from .models import Customer

        try:
            if not db:
                print("Warning: No database session provided for search")
                return {"data": [], "pagination": {}}

            # Search in local database
            query_lower = query.lower()

            # Use SQLAlchemy to search
            results = db.query(Customer).filter(
                (Customer.name.ilike(f"%{query}%")) |
                (Customer.mobile.like(f"%{query}%"))
            ).all()

            # Convert to dict format
            filtered = []
            for customer in results:
                customer_dict = {
                    "id": customer.id,
                    "name": customer.name,
                    "mobile": customer.mobile,
                    "email": customer.email,
                    "address": customer.address,
                    "creditLimit": customer.credit_limit,
                    "totalSpent": customer.total_spent,
                    "outstandingBalance": customer.outstanding_balance
                }
                filtered.append(customer_dict)

            # Paginate the filtered results
            page_size = 20
            start_idx = (page - 1) * page_size
            end_idx = start_idx + page_size
            paginated_filtered = filtered[start_idx:end_idx]

            result = {
                "data": paginated_filtered,
                "pagination": {
                    "total": len(filtered),
                    "page": page,
                    "pageSize": page_size,
                    "totalPages": (len(filtered) + page_size - 1) // page_size
                }
            }

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

    async def sync_all_customers_to_db(self, db: Session) -> Dict[str, Any]:
        """Fetch all customers from Ewity and sync to local database"""
        from .models import Customer

        try:
            print("🔄 Syncing customers from Ewity API...")

            synced_count = 0
            updated_count = 0
            page = 1
            total_pages = 1

            # Fetch all pages
            while page <= total_pages:
                print(f"  Fetching page {page}...")

                # Fetch customers page by page (API always returns 20 per page regardless of pageSize)
                data = await self._get("/customers", params={"page": page})
                customers = data.get("data", [])
                pagination = data.get("pagination", {})

                # Update total pages from first response
                if page == 1:
                    # API uses 'lastPage' not 'totalPages'
                    total_pages = pagination.get("lastPage", 1)
                    total_customers = pagination.get("total", 0)
                    print(f"  Found {total_pages} pages ({total_customers} total customers)")

                # Process customers from this page
                for customer_data in customers:
                    customer_id = customer_data.get("id")
                    if not customer_id:
                        continue

                    # Check if customer exists
                    existing = db.query(Customer).filter(Customer.id == customer_id).first()

                    customer_obj = existing or Customer(id=customer_id)
                    customer_obj.name = customer_data.get("name")
                    customer_obj.mobile = customer_data.get("mobile")
                    customer_obj.email = customer_data.get("email")
                    customer_obj.address = customer_data.get("address")
                    customer_obj.credit_limit = customer_data.get("creditLimit")
                    customer_obj.total_spent = customer_data.get("totalSpent")
                    customer_obj.outstanding_balance = customer_data.get("outstandingBalance")
                    customer_obj.data = json.dumps(customer_data)
                    customer_obj.synced_at = datetime.utcnow()

                    if existing:
                        updated_count += 1
                    else:
                        db.add(customer_obj)
                        synced_count += 1

                # Commit after each page to avoid memory issues
                db.commit()
                print(f"  ✓ Processed page {page}/{total_pages}")

                page += 1

            total = synced_count + updated_count
            print(f"✓ Synced {total} customers ({synced_count} new, {updated_count} updated)")

            return {
                "success": True,
                "total": total,
                "new": synced_count,
                "updated": updated_count
            }

        except Exception as e:
            print(f"❌ Error syncing customers: {e}")
            db.rollback()
            return {
                "success": False,
                "error": str(e)
            }


# Global client instance
ewity_client = EwityClient()
