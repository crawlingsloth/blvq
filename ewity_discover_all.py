#!/usr/bin/env python3
"""Discover all available Ewity API v1 endpoints"""

import requests
import json

API_TOKEN = "YOUR_EWITY_API_TOKEN_HERE"
BASE_URL = "https://api.ewitypos.com/v1"

headers = {"Authorization": f"Bearer {API_TOKEN}"}

print("=" * 80)
print("DISCOVERING ALL EWITY API v1 ENDPOINTS")
print("=" * 80)
print(f"Base URL: {BASE_URL}")
print("=" * 80 + "\n")

# Comprehensive list of possible endpoints
resources = [
    # Core resources
    "customers",
    "products",
    "items",
    "sales",
    "transactions",
    "orders",
    "invoices",
    "receipts",

    # Inventory
    "inventory",
    "stock",
    "categories",
    "suppliers",
    "vendors",

    # User & Auth
    "users",
    "employees",
    "auth",
    "profile",
    "me",

    # Company & Settings
    "company",
    "stores",
    "branches",
    "locations",
    "settings",

    # Reports & Analytics
    "reports",
    "analytics",
    "dashboard",
    "statistics",

    # Payments
    "payments",
    "payment-methods",

    # Tax & Financial
    "taxes",
    "discounts",

    # Additional
    "variations",
    "attributes",
    "brands",
    "units",
    "warehouses",
    "transfers",
    "adjustments",
    "counts",
    "purchases",
    "purchase-orders",
]

available_endpoints = {}

for resource in resources:
    url = f"{BASE_URL}/{resource}"
    try:
        response = requests.get(url, headers=headers, timeout=10)

        if response.status_code == 200:
            print(f"✓ /{resource:30} | Available")
            try:
                data = json.loads(response.text)
                # Store structure info
                available_endpoints[resource] = {
                    "url": f"/v1/{resource}",
                    "sample_response": response.text[:500],
                    "data_structure": list(data.keys()) if isinstance(data, dict) else "array"
                }

                # Print structure info
                if isinstance(data, dict):
                    if "pagination" in data:
                        total = data["pagination"].get("total", 0)
                        print(f"   → Paginated resource with {total} total items")
                    if "data" in data:
                        if isinstance(data["data"], list) and len(data["data"]) > 0:
                            first_item = data["data"][0]
                            print(f"   → Fields: {', '.join(list(first_item.keys())[:10])}")
                        elif isinstance(data["data"], dict):
                            print(f"   → Fields: {', '.join(list(data['data'].keys())[:10])}")

            except Exception as e:
                print(f"   → Could not parse response: {e}")

        elif response.status_code == 404:
            print(f"✗ /{resource:30} | Not Available")
        elif response.status_code in [401, 403]:
            print(f"⚠ /{resource:30} | Unauthorized (endpoint may exist)")
            available_endpoints[resource] = {"url": f"/v1/{resource}", "status": "unauthorized"}
        else:
            print(f"? /{resource:30} | Status: {response.status_code}")

    except Exception as e:
        print(f"✗ /{resource:30} | Error: {str(e)[:40]}")

print("\n" + "=" * 80)
print("DETAILED EXPLORATION OF AVAILABLE ENDPOINTS")
print("=" * 80)

for resource in list(available_endpoints.keys())[:5]:  # Explore first 5 in detail
    if available_endpoints[resource].get("status") != "unauthorized":
        print(f"\n{'=' * 80}")
        print(f"ENDPOINT: /v1/{resource}")
        print(f"{'=' * 80}")

        # Try to fetch a single item if it's a list endpoint
        try:
            # Get full first page
            response = requests.get(f"{BASE_URL}/{resource}", headers=headers, timeout=10)
            data = json.loads(response.text)

            print(json.dumps(data, indent=2)[:1000])

            # Try pagination
            if "pagination" in data:
                print("\n[... Pagination available ...]")
                print(f"Total pages: {data['pagination'].get('lastPage', 'unknown')}")

        except Exception as e:
            print(f"Error fetching details: {e}")

# Save results
print("\n" + "=" * 80)
print("SUMMARY OF AVAILABLE ENDPOINTS")
print("=" * 80)

print(f"\nTotal available endpoints: {len(available_endpoints)}")
print("\nEndpoints you can access:")
for resource, info in available_endpoints.items():
    if info.get("status") != "unauthorized":
        print(f"  • {info['url']}")

# Save to file
with open("ewity_available_endpoints.json", "w") as f:
    json.dump({
        "base_url": BASE_URL,
        "authentication": "Bearer token",
        "available_endpoints": available_endpoints
    }, f, indent=2)

print(f"\n📄 Complete endpoint information saved to: ewity_available_endpoints.json")
print("=" * 80)
