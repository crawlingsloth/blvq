#!/usr/bin/env python3
"""
Ewity POS API Explorer
Discovers available endpoints and tests API access
"""

import requests
import json
from typing import Dict, List, Tuple

# Your UAT token
API_TOKEN = "uat_DuVb2afCHOpEAoihxCCnQWGBcWEF"

# Possible base URLs to test
BASE_URLS = [
    "https://api.ewitypos.com",
    "https://api.ewitypos.com/v1",
    "https://api.ewitypos.com/api",
    "https://api.ewitypos.com/api/v1",
    "https://app.ewitypos.com/api",
    "https://app.ewitypos.com/api/v1",
    "https://api.ewity.com",
    "https://api.ewity.com/v1",
    "https://app.ewity.com/api",
    "https://uat.ewitypos.com/api",
    "https://uat.ewitypos.com/api/v1",
    "https://uat-api.ewitypos.com",
    "https://uat-api.ewitypos.com/v1",
    "https://backend.ewitypos.com",
    "https://backend.ewitypos.com/api",
]

# Common API endpoints to test
ENDPOINTS = [
    # Authentication & Info
    "/me",
    "/user",
    "/auth/user",
    "/profile",
    "/info",
    "/status",
    "/health",

    # Sales & Orders
    "/sales",
    "/orders",
    "/transactions",
    "/invoices",
    "/receipts",

    # Products & Inventory
    "/products",
    "/items",
    "/inventory",
    "/stock",
    "/categories",

    # Customers
    "/customers",
    "/clients",

    # Reports
    "/reports",
    "/analytics",
    "/dashboard",

    # Other
    "/suppliers",
    "/users",
    "/stores",
    "/branches",
    "/settings",
]

# Different authentication methods to try
def get_auth_headers(token: str) -> List[Dict[str, str]]:
    """Generate different authentication header combinations"""
    return [
        {"Authorization": f"Bearer {token}"},
        {"Authorization": f"Token {token}"},
        {"X-API-Key": token},
        {"X-Auth-Token": token},
        {"api-key": token},
        {"token": token},
    ]


def test_endpoint(base_url: str, endpoint: str, headers: Dict[str, str]) -> Tuple[bool, int, any]:
    """Test a single endpoint with given headers"""
    url = f"{base_url}{endpoint}"
    try:
        response = requests.get(url, headers=headers, timeout=10)
        return True, response.status_code, response.text[:500] if response.text else None
    except requests.exceptions.RequestException as e:
        return False, 0, str(e)


def explore_api():
    """Main function to explore the API"""
    print("=" * 80)
    print("EWITY POS API EXPLORER")
    print("=" * 80)
    print(f"\nTesting with token: {API_TOKEN[:20]}...\n")

    working_base_url = None
    working_auth_header = None
    successful_endpoints = []

    # First, find the working base URL and auth method
    print("STEP 1: Finding working base URL and authentication method...")
    print("-" * 80)

    for base_url in BASE_URLS:
        print(f"\nTesting base URL: {base_url}")

        for auth_header in get_auth_headers(API_TOKEN):
            auth_method = list(auth_header.keys())[0]

            # Test with a simple endpoint
            for test_endpoint_path in ["/me", "/user", "/info", "/status", "/"]:
                success, status_code, response = test_endpoint(base_url, test_endpoint_path, auth_header)

                if success and status_code in [200, 201]:
                    print(f"  ✓ SUCCESS! {base_url}{test_endpoint_path}")
                    print(f"    Auth method: {auth_method}")
                    print(f"    Status: {status_code}")
                    print(f"    Response preview: {response[:200]}...")
                    working_base_url = base_url
                    working_auth_header = auth_header
                    break
                elif success and status_code in [401, 403]:
                    print(f"  ✗ Auth failed ({status_code}) for {auth_method}")
                elif success and status_code == 404:
                    print(f"  - Endpoint not found: {test_endpoint_path}")

            if working_base_url:
                break

        if working_base_url:
            break

    if not working_base_url:
        print("\n⚠️  Could not find a working base URL with the provided token.")
        print("    Trying all endpoints anyway to gather information...\n")
        # Use the first base URL as default
        working_base_url = BASE_URLS[0]
        working_auth_header = get_auth_headers(API_TOKEN)[0]

    # Now test all endpoints
    print("\n" + "=" * 80)
    print("STEP 2: Testing all common endpoints...")
    print("=" * 80)

    results = {
        "success": [],
        "unauthorized": [],
        "not_found": [],
        "error": []
    }

    for endpoint in ENDPOINTS:
        success, status_code, response = test_endpoint(
            working_base_url,
            endpoint,
            working_auth_header
        )

        if success:
            if status_code in [200, 201]:
                results["success"].append((endpoint, status_code, response))
                print(f"✓ {endpoint:30} | Status: {status_code} | Available")
            elif status_code in [401, 403]:
                results["unauthorized"].append((endpoint, status_code))
                print(f"⚠ {endpoint:30} | Status: {status_code} | Unauthorized")
            elif status_code == 404:
                results["not_found"].append((endpoint, status_code))
                print(f"✗ {endpoint:30} | Status: {status_code} | Not Found")
            else:
                results["error"].append((endpoint, status_code, response))
                print(f"? {endpoint:30} | Status: {status_code} | {response[:50] if response else 'Unknown'}")
        else:
            print(f"✗ {endpoint:30} | Connection error")

    # Print summary
    print("\n" + "=" * 80)
    print("SUMMARY")
    print("=" * 80)

    if working_base_url:
        print(f"\n✓ Working Base URL: {working_base_url}")
        print(f"✓ Auth Header: {list(working_auth_header.keys())[0]}")

    print(f"\n📊 Results:")
    print(f"  - Successful endpoints: {len(results['success'])}")
    print(f"  - Unauthorized: {len(results['unauthorized'])}")
    print(f"  - Not found: {len(results['not_found'])}")
    print(f"  - Errors: {len(results['error'])}")

    if results["success"]:
        print("\n✓ AVAILABLE ENDPOINTS:")
        print("-" * 80)
        for endpoint, status, response in results["success"]:
            print(f"\n{endpoint}")
            print(f"  Status: {status}")
            print(f"  Response preview:")
            try:
                # Try to pretty print JSON
                json_data = json.loads(response)
                print(f"  {json.dumps(json_data, indent=2)[:300]}...")
            except:
                print(f"  {response[:200]}...")

    # Save detailed results
    output_file = "ewity_api_results.json"
    with open(output_file, 'w') as f:
        json.dump({
            "base_url": working_base_url,
            "auth_header": {k: "***" for k in working_auth_header.keys()},
            "successful_endpoints": [{"endpoint": e, "status": s} for e, s, _ in results["success"]],
            "unauthorized_endpoints": [{"endpoint": e, "status": s} for e, s in results["unauthorized"]],
            "not_found_endpoints": [{"endpoint": e, "status": s} for e, s in results["not_found"]],
        }, f, indent=2)

    print(f"\n📄 Detailed results saved to: {output_file}")
    print("\n" + "=" * 80)


if __name__ == "__main__":
    explore_api()
