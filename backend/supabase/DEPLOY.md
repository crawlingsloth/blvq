# Deploying BLVQ Supabase Functions

## Prerequisites

1. Supabase CLI installed (already done ✅)
2. Supabase access token

## Step 1: Get Your Supabase Access Token

1. Go to https://supabase.com/dashboard/account/tokens
2. Click "Generate new token"
3. Give it a name like "BLVQ Deploy"
4. Copy the token

## Step 2: Set Environment Variables

Create a `.env` file in this directory:

```bash
cd /home/eshan/production/services/blvq/backend
nano .env  # or use your preferred editor
```

Add these variables:

```
SUPABASE_ACCESS_TOKEN=your-access-token-here
JWT_SECRET=your-secret-key-must-be-at-least-32-characters-long-change-this
EWITY_API_BASE_URL=https://api.ewitypos.com/v1
EWITY_API_TOKEN=uat_DuVb2afCHOpEAoihxCCnQWGBcWEF
FRONTEND_URL=https://blvq.crawlingsloth.cloud
```

## Step 3: Link to Your Supabase Project

```bash
export SUPABASE_ACCESS_TOKEN=your-token-here
supabase link --project-ref mjntmxvknohuqajulgvt
```

## Step 4: Deploy All Functions

Run the deploy script:

```bash
chmod +x deploy-functions.sh
./deploy-functions.sh
```

Or deploy manually one by one:

```bash
supabase functions deploy admin-login
supabase functions deploy customer-search
supabase functions deploy customer-list
supabase functions deploy customer-link-create
supabase functions deploy customer-links-list
supabase functions deploy customer-link-delete
supabase functions deploy customer-balance
supabase functions deploy customer-qr
supabase functions deploy customer-refresh
```

## Step 5: Set Environment Variables on Supabase

The functions need these environment variables set in Supabase:

```bash
supabase secrets set JWT_SECRET=your-secret-key-must-be-at-least-32-characters-long-change-this
supabase secrets set EWITY_API_BASE_URL=https://api.ewitypos.com/v1
supabase secrets set EWITY_API_TOKEN=uat_DuVb2afCHOpEAoihxCCnQWGBcWEF
supabase secrets set FRONTEND_URL=https://blvq.crawlingsloth.cloud
```

**Important:** The `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are automatically available in Supabase Functions, you don't need to set them.

## Step 6: Test the Functions

Once deployed, your functions will be available at:

```
https://mjntmxvknohuqajulgvt.supabase.co/functions/v1/admin-login
https://mjntmxvknohuqajulgvt.supabase.co/functions/v1/customer-search
https://mjntmxvknohuqajulgvt.supabase.co/functions/v1/customer-list
https://mjntmxvknohuqajulgvt.supabase.co/functions/v1/customer-link-create
https://mjntmxvknohuqajulgvt.supabase.co/functions/v1/customer-links-list
https://mjntmxvknohuqajulgvt.supabase.co/functions/v1/customer-link-delete/:uuid
https://mjntmxvknohuqajulgvt.supabase.co/functions/v1/customer-balance/:uuid
https://mjntmxvknohuqajulgvt.supabase.co/functions/v1/customer-qr/:uuid/qr
https://mjntmxvknohuqajulgvt.supabase.co/functions/v1/customer-refresh
```

Test the login function:

```bash
curl -X POST https://mjntmxvknohuqajulgvt.supabase.co/functions/v1/admin-login \
  -H "Content-Type: application/json" \
  -d '{"username": "blvqadmin", "password": "BLVQ123!@#"}'
```

## Troubleshooting

### "Function not found"
- Make sure the function is deployed: `supabase functions list`
- Redeploy if needed

### "Authorization required"
- Check that your JWT_SECRET is set correctly
- Verify the token in your request is valid

### "Ewity API error"
- Verify EWITY_API_TOKEN is set correctly
- Check EWITY_API_BASE_URL is correct

### View function logs
```bash
supabase functions logs admin-login
supabase functions logs customer-balance
# etc.
```

## Redeploying After Changes

If you make changes to a function:

```bash
supabase functions deploy function-name
```

Or redeploy all:

```bash
./deploy-functions.sh
```
