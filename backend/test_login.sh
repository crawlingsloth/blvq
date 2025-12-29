#!/bin/bash
# Test admin login

echo "🧪 Testing Admin Login..."
echo "================================"

# Test if server is running
if ! curl -s http://localhost:8000/health > /dev/null 2>&1; then
    echo "❌ Backend server is not running!"
    echo "   Please start it with: ./start.sh"
    exit 1
fi

echo "✓ Server is running"
echo ""
echo "Testing login with admin/admin123..."
echo ""

# Test login
response=$(curl -s -X POST http://localhost:8000/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}')

if echo "$response" | grep -q "access_token"; then
    echo "✅ Login successful!"
    echo ""
    echo "Response:"
    echo "$response" | jq .
else
    echo "❌ Login failed!"
    echo ""
    echo "Response:"
    echo "$response" | jq .
fi

echo ""
echo "================================"
