#!/bin/bash

set -e

echo "🚀 Deploying BLVQ Supabase Functions..."
echo ""

# Check if SUPABASE_ACCESS_TOKEN is set
if [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
  echo "❌ Error: SUPABASE_ACCESS_TOKEN is not set"
  echo "Please set it by running:"
  echo "  export SUPABASE_ACCESS_TOKEN=your-token-here"
  echo ""
  echo "Get your token from: https://supabase.com/dashboard/account/tokens"
  exit 1
fi

# Array of function names
functions=(
  "admin-login"
  "customer-search"
  "customer-list"
  "customer-link-create"
  "customer-links-list"
  "customer-link-delete"
  "customer-balance"
  "customer-qr"
  "customer-refresh"
)

echo "📦 Deploying ${#functions[@]} functions..."
echo ""

# Deploy each function
for func in "${functions[@]}"; do
  echo "  Deploying $func..."
  supabase functions deploy "$func" --no-verify-jwt
  echo "  ✓ $func deployed"
  echo ""
done

echo "✅ All functions deployed successfully!"
echo ""
echo "🔑 Don't forget to set environment variables:"
echo "  supabase secrets set JWT_SECRET=your-secret"
echo "  supabase secrets set EWITY_API_TOKEN=your-token"
echo "  supabase secrets set EWITY_API_BASE_URL=https://api.ewitypos.com/v1"
echo "  supabase secrets set FRONTEND_URL=https://blvq.crawlingsloth.cloud"
echo ""
echo "🧪 Test your functions:"
echo "  curl -X POST https://mjntmxvknohuqajulgvt.supabase.co/functions/v1/admin-login \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"username\": \"blvqadmin\", \"password\": \"BLVQ123!@#\"}'"
echo ""
