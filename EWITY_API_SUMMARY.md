# Ewity POS API - Complete Endpoint Discovery Report

**Date:** 2025-12-28
**API Token:** YOUR_EWITY_API_TOKEN_HERE
**Base URL:** https://api.ewitypos.com/v1
**Authentication:** Bearer Token

---

## Summary

✓ **Total Accessible Endpoints:** 6
✓ **API Version:** v1
✓ **Authentication Method:** Bearer Token in Authorization header

---

## Available Endpoints

### 1. `/v1` - API Information
**Method:** GET
**Purpose:** Get API version and description

**Response:**
```json
{
  "data": {
    "description": "Ewity Api",
    "version": "v1"
  }
}
```

---

### 2. `/v1/customers` - Customer Management
**Method:** GET
**Purpose:** Retrieve customer data
**Total Records:** 241
**Pagination:** Yes (20 items per page, 13 total pages)

**Fields Available:**
- `id` - Customer ID
- `company_name` - Company name (if applicable)
- `name` - Customer name
- `address` - Customer address
- `email` - Email address
- `mobile` - Mobile number
- `birthday` - Date of birth
- `passport` - Passport number
- `bill_note` - Billing notes
- `price_level` - Price level assigned
- `tax_number` - Tax identification number
- `note` - Additional notes
- `credit_limit` - Credit limit amount
- `total_outstanding` - Outstanding balance
- `total_spent` - Total amount spent
- `loyalty_points` - Loyalty program points
- `loyalty_text` - Loyalty tier description
- `loyalty_program` - Loyalty program ID
- `created_unix` - Creation timestamp

**Sample Response:**
```json
{
  "pagination": {
    "total": 241,
    "pageSize": 20,
    "current": 1,
    "lastPage": 13
  },
  "data": [
    {
      "id": 1517829,
      "company_name": null,
      "name": "steelu ibbe",
      "address": null,
      "email": null,
      "mobile": "0090909",
      "birthday": null,
      "passport": null,
      "bill_note": null,
      "price_level": null,
      "tax_number": null,
      "note": null,
      "credit_limit": 500,
      "total_outstanding": 0,
      "total_spent": 214,
      "loyalty_points": null,
      "loyalty_text": "No Loyalty",
      "loyalty_text_extra": null,
      "loyalty_program": null,
      "created_unix": 1766627737
    }
  ]
}
```

---

### 3. `/v1/users` - User Management
**Method:** GET
**Purpose:** Retrieve user accounts
**Total Records:** 2
**Pagination:** Yes

**Fields Available:**
- `id` - User ID
- `username` - Login username
- `type` - User type (api, default)
- `name` - Display name
- `email` - Email address
- `mobile` - Mobile number
- `created` - Creation info (timestamp and creator)

**Sample Response:**
```json
{
  "pagination": {
    "total": 2,
    "pageSize": 20,
    "current": 1,
    "lastPage": 1
  },
  "data": [
    {
      "id": 35697,
      "username": "diehardofdeath",
      "type": "api",
      "name": "Naanu",
      "email": "eshanshafeeq073055@gmail.com",
      "mobile": null,
      "created": {
        "at": "2025-12-28 16:21:14",
        "by": "Ahusan"
      }
    }
  ],
  "search": {
    "default": "name",
    "searches": {
      "name": {"name": "Name"},
      "username": {"name": "username"}
    }
  }
}
```

---

### 4. `/v1/employees` - Employee Management
**Method:** GET
**Purpose:** Retrieve employee data
**Total Records:** 0
**Pagination:** Yes

**Sample Response:**
```json
{
  "pagination": {
    "total": 0,
    "pageSize": 20,
    "current": 1,
    "lastPage": 1
  },
  "data": []
}
```

---

### 5. `/v1/locations` - Location/Store Information
**Method:** GET
**Purpose:** Retrieve store/location data

**Fields Available:**
- `id` - Location ID
- `name` - Location name
- `display_name` - Display name
- `type` - Location type (e.g., retail)
- `tax_number` - Tax number
- `tax_activity_number` - Tax activity number
- `street_address` - Street address
- `city` - City
- `country` - Country
- `phone` - Phone number
- `bill_note` - Billing note
- `price_level` - Price level
- `qr_menu_url` - QR menu URL

**Sample Response:**
```json
{
  "data": [
    {
      "id": 9897,
      "name": "BLVQ",
      "display_name": null,
      "type": "retail",
      "tax_number": null,
      "tax_activity_number": null,
      "street_address": null,
      "city": null,
      "country": null,
      "phone": null,
      "bill_note": "",
      "price_level": null,
      "qr_menu_url": null
    }
  ]
}
```

---

### 6. `/v1/expenses` - Expense Management
**Method:** GET
**Purpose:** Retrieve expense data
**Total Records:** 9

**Fields Available:**
- `id` - Expense ID
- `category` - Expense category
- `description` - Expense description
- `amount` - Amount (numeric)
- `amount_text` - Amount (formatted text)
- `date` - Expense date
- `created` - Creation timestamp
- `updated` - Last update timestamp

---

### 7. `/v1/tags` - Tag Management
**Method:** GET
**Purpose:** Retrieve tags
**Total Records:** 0

---

## API Usage Examples

### Python Example
```python
import requests

API_TOKEN = "YOUR_EWITY_API_TOKEN_HERE"
BASE_URL = "https://api.ewitypos.com/v1"
headers = {"Authorization": f"Bearer {API_TOKEN}"}

# Get customers
response = requests.get(f"{BASE_URL}/customers", headers=headers)
customers = response.json()

# Get specific page
response = requests.get(f"{BASE_URL}/customers?page=2", headers=headers)
customers_page_2 = response.json()

# Get users
response = requests.get(f"{BASE_URL}/users", headers=headers)
users = response.json()

# Get location info
response = requests.get(f"{BASE_URL}/locations", headers=headers)
locations = response.json()

# Get expenses
response = requests.get(f"{BASE_URL}/expenses", headers=headers)
expenses = response.json()
```

### cURL Example
```bash
# Get customers
curl -H "Authorization: Bearer YOUR_EWITY_API_TOKEN_HERE" \
  https://api.ewitypos.com/v1/customers

# Get users
curl -H "Authorization: Bearer YOUR_EWITY_API_TOKEN_HERE" \
  https://api.ewitypos.com/v1/users

# Get locations
curl -H "Authorization: Bearer YOUR_EWITY_API_TOKEN_HERE" \
  https://api.ewitypos.com/v1/locations
```

---

## Pagination

Endpoints that support pagination return data in this format:

```json
{
  "pagination": {
    "total": 241,
    "pageSize": 20,
    "current": 1,
    "lastPage": 13
  },
  "data": [...]
}
```

To access different pages, use the `page` query parameter:
- Page 1: `https://api.ewitypos.com/v1/customers?page=1`
- Page 2: `https://api.ewitypos.com/v1/customers?page=2`

---

## Search Functionality

Some endpoints (like `/v1/users`) include search configuration:

```json
{
  "search": {
    "default": "name",
    "searches": {
      "name": {"name": "Name"},
      "username": {"name": "username"}
    }
  }
}
```

This suggests search parameters may be available (implementation details would need to be confirmed with Ewity support).

---

## Endpoints NOT Available (404)

The following common POS endpoints were tested but returned 404:
- `/v1/products` - Product catalog
- `/v1/sales` - Sales transactions
- `/v1/inventory` - Inventory/stock data
- `/v1/orders` - Orders
- `/v1/transactions` - Transactions
- `/v1/invoices` - Invoices
- `/v1/reports` - Reports
- `/v1/payments` - Payment data
- `/v1/suppliers` - Supplier data
- `/v1/categories` - Product categories

**Note:** These endpoints may exist with different names or may require additional permissions. Contact Ewity support for complete API documentation.

---

## Next Steps

1. **Get Official Documentation**
   Contact Ewity support at:
   - Email: hello@ewity.com
   - Phone: +960 4006262
   - Request complete API documentation

2. **Test Additional Endpoints**
   Try variations of common POS resources to discover more endpoints

3. **Check Permissions**
   Your API token may have limited permissions. Check with your admin to ensure you have access to all necessary endpoints.

4. **Explore POST/PUT/DELETE Methods**
   The current tests only used GET requests. The API likely supports:
   - POST - Create new records
   - PUT/PATCH - Update existing records
   - DELETE - Delete records

---

## Technical Details

- **Server:** Cloudflare (PHP/7.2.34)
- **Response Format:** JSON
- **Error Format:**
  ```json
  {
    "code": 404,
    "errorCode": "NOT_FOUND",
    "message": "Invalid API endpoint",
    "errorRef": "MTG1M",
    "ts": 1766921784,
    "errorCodeText": "Not Found"
  }
  ```

---

## Files Generated

1. `ewity_api_explorer.py` - Initial API exploration script
2. `ewity_quick_test.py` - Quick diagnostic test
3. `ewity_final_test.py` - Comprehensive endpoint test
4. `ewity_discover_all.py` - Detailed endpoint discovery
5. `ewity_find_more.py` - Additional endpoint search
6. `ewity_available_endpoints.json` - JSON export of endpoints
7. `ewity_all_endpoints.json` - Complete endpoint list
8. `EWITY_API_SUMMARY.md` - This documentation

---

**Generated on:** 2025-12-28
**For:** BLVQ / Ewity POS UAT Environment
