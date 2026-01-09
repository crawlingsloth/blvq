#!/usr/bin/env python3
"""Final comprehensive test for Ewity API"""

import requests
import json

API_TOKEN = "YOUR_EWITY_API_TOKEN_HERE"
BASE_URL = "https://api.ewitypos.com"

headers = {"Authorization": f"Bearer {API_TOKEN}"}

print("=" * 80)
print("COMPREHENSIVE EWITY API ENDPOINT TEST")
print("=" * 80)
print(f"Base URL: {BASE_URL}")
print(f"Token: {API_TOKEN[:20]}...")
print("=" * 80)

# Test various endpoint patterns
endpoints_to_test = [
    # Versioned endpoints
    "/v1",
    "/v2",
    "/v1/info",
    "/v1/me",
    "/v1/user",
    "/v1/sales",
    "/v1/products",
    "/v1/customers",
    "/v1/orders",
    "/v1/inventory",

    # Common POS patterns
    "/pos/sales",
    "/pos/products",
    "/pos/inventory",

    # Resource-based
    "/sales",
    "/sales/list",
    "/sales/get",
    "/products",
    "/products/list",
    "/customers",
    "/customers/list",
    "/orders",
    "/orders/list",
    "/inventory",
    "/inventory/list",

    # Data/fetch patterns
    "/data/sales",
    "/data/products",
    "/fetch/sales",
    "/fetch/products",

    # Common API patterns
    "/company",
    "/company/info",
    "/auth",
    "/auth/validate",
    "/validate",
]

successful = []
unauthorized = []
not_found = []
other_errors = []

for endpoint in endpoints_to_test:
    url = f"{BASE_URL}{endpoint}"
    try:
        response = requests.get(url, headers=headers, timeout=10)

        status = response.status_code
        symbol = "✓" if status == 200 else "⚠" if status in [401, 403] else "✗"

        print(f"{symbol} {endpoint:35} | Status: {status}", end="")

        if status == 200:
            successful.append((endpoint, response.text[:200]))
            print(" | SUCCESS!")
            try:
                data = json.loads(response.text)
                print(f"   Response: {json.dumps(data, indent=2)[:300]}")
            except:
                print(f"   Response: {response.text[:200]}")
        elif status in [401, 403]:
            unauthorized.append(endpoint)
            print(" | Unauthorized")
        elif status == 404:
            not_found.append(endpoint)
            # Try to parse error message
            try:
                error = json.loads(response.text)
                if error.get('message') != "Invalid API endpoint":
                    print(f" | {error.get('message', 'Not Found')}")
                else:
                    print(" | Not Found")
            except:
                print(" | Not Found")
        else:
            other_errors.append((endpoint, status, response.text[:100]))
            print(f" | Error: {response.text[:50]}")

    except Exception as e:
        print(f"✗ {endpoint:35} | Connection Error: {str(e)[:50]}")

print("\n" + "=" * 80)
print("SUMMARY")
print("=" * 80)
print(f"✓ Successful (200): {len(successful)}")
print(f"⚠ Unauthorized (401/403): {len(unauthorized)}")
print(f"✗ Not Found (404): {len(not_found)}")
print(f"? Other Errors: {len(other_errors)}")

if successful:
    print("\n" + "=" * 80)
    print("SUCCESSFUL ENDPOINTS:")
    print("=" * 80)
    for endpoint, response in successful:
        print(f"\n{endpoint}")
        print(f"  {response}")

if unauthorized:
    print("\n" + "=" * 80)
    print("UNAUTHORIZED ENDPOINTS (May be valid but need different auth):")
    print("=" * 80)
    for endpoint in unauthorized:
        print(f"  {endpoint}")

# Test if there's a documentation endpoint
print("\n" + "=" * 80)
print("CHECKING FOR DOCUMENTATION ENDPOINTS:")
print("=" * 80)

doc_endpoints = ["/docs", "/documentation", "/api-docs", "/swagger", "/openapi", "/swagger.json", "/openapi.json"]
for endpoint in doc_endpoints:
    try:
        response = requests.get(f"{BASE_URL}{endpoint}", headers=headers, timeout=10)
        if response.status_code == 200:
            print(f"✓ Found: {endpoint}")
            print(f"  {response.text[:200]}")
        else:
            print(f"✗ {endpoint} - Status: {response.status_code}")
    except:
        pass

print("\n" + "=" * 80)
