#!/usr/bin/env python3
"""Quick diagnostic test for Ewity API"""

import requests
import json

API_TOKEN = "uat_DuVb2afCHOpEAoihxCCnQWGBcWEF"

print("Quick Ewity API Diagnostic Test")
print("=" * 80)

# Test the main base URLs
base_urls = [
    "https://api.ewitypos.com",
    "https://app.ewitypos.com",
]

headers = {"Authorization": f"Bearer {API_TOKEN}"}

for base_url in base_urls:
    print(f"\nTesting: {base_url}")
    print("-" * 80)

    # Test root
    try:
        response = requests.get(base_url, headers=headers, timeout=10)
        print(f"Status: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        print(f"Response: {response.text[:500]}")

        # Try with /api
        response2 = requests.get(f"{base_url}/api", headers=headers, timeout=10)
        print(f"\n{base_url}/api")
        print(f"Status: {response2.status_code}")
        print(f"Response: {response2.text[:500]}")

    except Exception as e:
        print(f"Error: {e}")

print("\n" + "=" * 80)
print("Testing with OPTIONS method to discover endpoints...")
print("=" * 80)

for base_url in ["https://api.ewitypos.com", "https://app.ewitypos.com/api"]:
    try:
        response = requests.options(base_url, headers=headers, timeout=10)
        print(f"\n{base_url}")
        print(f"Status: {response.status_code}")
        print(f"Allowed methods: {response.headers.get('Allow', 'N/A')}")
        print(f"Headers: {dict(response.headers)}")
    except Exception as e:
        print(f"Error: {e}")
