#!/usr/bin/env python3
"""Find more Ewity API endpoints with different naming patterns"""

import requests
import json

API_TOKEN = "uat_DuVb2afCHOpEAoihxCCnQWGBcWEF"
BASE_URL = "https://api.ewitypos.com/v1"

headers = {"Authorization": f"Bearer {API_TOKEN}"}

print("=" * 80)
print("SEARCHING FOR SALES, PRODUCTS, AND INVENTORY ENDPOINTS")
print("=" * 80 + "\n")

# Try many variations for critical resources
variations = [
    # Products
    "product", "products", "item", "items", "catalog", "goods", "sku", "skus",
    "menu-items", "menu", "merchandise",

    # Sales
    "sale", "sales", "transaction", "transactions", "bill", "bills", "invoice",
    "invoices", "receipt", "receipts", "order", "orders", "pos-sales", "checkout",

    # Inventory
    "inventory", "inventories", "stock", "stocks", "warehouse", "warehouses",

    # Reports & Analytics
    "report", "reports", "analytic", "analytics", "stat", "stats", "statistics",
    "summary", "dashboard",

    # Financial
    "payment", "payments", "refund", "refunds", "expense", "expenses",

    # Suppliers & Purchases
    "supplier", "suppliers", "vendor", "vendors", "purchase", "purchases",
    "purchase-order", "purchase-orders", "po", "pos",

    # Categories & Organization
    "category", "categories", "brand", "brands", "tag", "tags",

    # Other
    "tax", "taxes", "discount", "discounts", "loyalty", "reward", "rewards",
    "transfer", "transfers", "adjustment", "adjustments", "count", "counts",
    "session", "sessions", "shift", "shifts", "register", "registers",
]

found_endpoints = []

for variation in variations:
    url = f"{BASE_URL}/{variation}"
    try:
        response = requests.get(url, headers=headers, timeout=10)

        if response.status_code == 200:
            print(f"✓ /{variation:35} | FOUND!")
            try:
                data = json.loads(response.text)

                # Get summary info
                if isinstance(data, dict):
                    if "pagination" in data:
                        total = data["pagination"].get("total", 0)
                        print(f"   → Total items: {total}")
                    if "data" in data:
                        if isinstance(data["data"], list):
                            print(f"   → Records: {len(data['data'])}")
                            if len(data["data"]) > 0:
                                first = data["data"][0]
                                fields = list(first.keys())[:15]
                                print(f"   → Fields: {', '.join(fields)}")
                        elif isinstance(data["data"], dict):
                            fields = list(data["data"].keys())[:15]
                            print(f"   → Fields: {', '.join(fields)}")

                found_endpoints.append({
                    "endpoint": variation,
                    "url": f"/v1/{variation}",
                    "response_preview": response.text[:500]
                })

            except Exception as e:
                print(f"   → Response (not JSON): {response.text[:100]}")
                found_endpoints.append({
                    "endpoint": variation,
                    "url": f"/v1/{variation}",
                    "note": "Non-JSON response"
                })

        elif response.status_code == 404:
            # Don't print 404s to reduce noise
            pass
        elif response.status_code in [401, 403]:
            print(f"⚠ /{variation:35} | Unauthorized (endpoint exists)")
            found_endpoints.append({
                "endpoint": variation,
                "url": f"/v1/{variation}",
                "status": "unauthorized"
            })

    except Exception as e:
        pass  # Skip connection errors silently

print("\n" + "=" * 80)
print("FOUND ENDPOINTS SUMMARY")
print("=" * 80)

if found_endpoints:
    print(f"\nTotal new endpoints found: {len(found_endpoints)}\n")
    for ep in found_endpoints:
        status = ep.get("status", "available")
        print(f"  • /v1/{ep['endpoint']:30} | {status}")

    # Save to file
    with open("ewity_all_endpoints.json", "w") as f:
        json.dump({
            "base_url": BASE_URL,
            "found_endpoints": found_endpoints
        }, f, indent=2)

    print(f"\n📄 Saved to: ewity_all_endpoints.json")
else:
    print("\nNo additional endpoints found.")

print("=" * 80)
