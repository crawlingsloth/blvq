# ✅ Supabase Functions Migration Complete!

Your BLVQ backend has been successfully converted to Supabase Edge Functions! 🎉

## What Was Done

### ✅ Database
- [x] Initialized PostgreSQL schema with `blvq__` prefixed tables
- [x] Synced 244 customers from Ewity API
- [x] Created admin user (`blvqadmin` / `BLVQ123!@#`)

### ✅ Backend - Supabase Edge Functions Created
All backend endpoints have been converted to Deno-based Supabase Functions:

1. **admin-login** - Admin authentication
2. **customer-search** - Search customers by name/phone
3. **customer-list** - Get paginated customer list
4. **customer-link-create** - Link customer to UUID
5. **customer-links-list** - Get all linked customers
6. **customer-link-delete** - Remove customer link
7. **customer-balance** - Get customer balance (public endpoint)
8. **customer-qr** - Generate QR code (public endpoint)
9. **customer-refresh** - Sync customers from Ewity

### ✅ Frontend Updated
- [x] Updated API base URL to Supabase Functions
- [x] Modified all endpoint paths to match function names
- [x] Updated response structure handling
- [x] Updated PWA service worker cache configuration

### ✅ Deployment Ready
- [x] Created deployment script (`deploy-functions.sh`)
- [x] Created deployment documentation (`supabase/DEPLOY.md`)
- [x] Configured CORS for all functions
- [x] Set up shared utilities for auth, database, and Ewity client

---

## 🚀 Next Steps - Deploy to Supabase

### 1. Get Supabase Access Token

Visit https://supabase.com/dashboard/account/tokens and generate a new token.

### 2. Link Your Project

```bash
export SUPABASE_ACCESS_TOKEN=your-token-here
cd /home/eshan/production/services/blvq/backend
supabase link --project-ref mjntmxvknohuqajulgvt
```

### 3. Deploy All Functions

```bash
./deploy-functions.sh
```

This will deploy all 9 functions to your Supabase project.

### 4. Set Environment Secrets

```bash
supabase secrets set JWT_SECRET=your-secret-key-must-be-at-least-32-characters-long-change-this
supabase secrets set EWITY_API_TOKEN=YOUR_EWITY_API_TOKEN_HERE
supabase secrets set EWITY_API_BASE_URL=https://api.ewitypos.com/v1
supabase secrets set FRONTEND_URL=https://blvq.crawlingsloth.cloud
```

### 5. Deploy Frontend

```bash
cd ../frontend
npm run build
# Deploy to your hosting (Vercel, Netlify, etc.)
```

### 6. Test Everything

Test admin login:
```bash
curl -X POST https://mjntmxvknohuqajulgvt.supabase.co/functions/v1/admin-login \
  -H "Content-Type: application/json" \
  -d '{"username": "blvqadmin", "password": "BLVQ123!@#"}'
```

Test customer balance (use a real UUID from your database):
```bash
curl https://mjntmxvknohuqajulgvt.supabase.co/functions/v1/customer-balance/YOUR-UUID-HERE
```

---

## 📂 Project Structure

```
backend/
├── supabase/
│   ├── functions/
│   │   ├── _shared/              # Shared utilities
│   │   │   ├── auth.ts           # JWT & password hashing
│   │   │   ├── cors.ts           # CORS headers
│   │   │   ├── database.ts       # Supabase client & types
│   │   │   └── ewity.ts          # Ewity API client
│   │   ├── admin-login/
│   │   ├── customer-search/
│   │   ├── customer-list/
│   │   ├── customer-link-create/
│   │   ├── customer-links-list/
│   │   ├── customer-link-delete/
│   │   ├── customer-balance/
│   │   ├── customer-qr/
│   │   └── customer-refresh/
│   ├── config.toml
│   └── DEPLOY.md
├── backend-nodejs/               # Node.js version (backup)
├── deploy-functions.sh           # Deployment script
└── SUPABASE_FUNCTIONS_COMPLETE.md  # This file

frontend/
├── src/
│   ├── lib/
│   │   └── api.ts                # ✅ Updated to use Supabase Functions
│   ├── components/
│   │   └── admin/
│   │       └── Dashboard.tsx     # ✅ Updated response structure
│   └── vite.config.ts            # ✅ Updated cache patterns
```

---

## 🔗 Function URLs

Once deployed, your functions will be available at:

| Function | URL |
|----------|-----|
| Admin Login | `https://mjntmxvknohuqajulgvt.supabase.co/functions/v1/admin-login` |
| Customer Search | `https://mjntmxvknohuqajulgvt.supabase.co/functions/v1/customer-search` |
| Customer List | `https://mjntmxvknohuqajulgvt.supabase.co/functions/v1/customer-list` |
| Create Link | `https://mjntmxvknohuqajulgvt.supabase.co/functions/v1/customer-link-create` |
| List Links | `https://mjntmxvknohuqajulgvt.supabase.co/functions/v1/customer-links-list` |
| Delete Link | `https://mjntmxvknohuqajulgvt.supabase.co/functions/v1/customer-link-delete/:uuid` |
| Customer Balance | `https://mjntmxvknohuqajulgvt.supabase.co/functions/v1/customer-balance/:uuid` |
| Customer QR | `https://mjntmxvknohuqajulgvt.supabase.co/functions/v1/customer-qr/:uuid/qr` |
| Refresh Data | `https://mjntmxvknohuqajulgvt.supabase.co/functions/v1/customer-refresh` |

---

## 🎯 Key Differences from Node.js Backend

| Aspect | Node.js (Express) | Supabase Functions (Deno) |
|--------|------------------|---------------------------|
| Runtime | Node.js | Deno |
| Entry Point | Single `index.ts` | Separate function per endpoint |
| Database | Direct PostgreSQL (pg) | Supabase Client |
| Imports | npm packages | HTTP imports (esm.sh) |
| Environment | `.env` file | `supabase secrets` |
| Deployment | Docker/Fly.io | `supabase functions deploy` |
| Scaling | Manual | Automatic (serverless) |
| Cold Starts | ~100-500ms | ~50-200ms |

---

## 📝 Important Notes

1. **JWT Secret**: Make sure to use the same `JWT_SECRET` that was used when creating the admin user
2. **CORS**: Already configured for `*` (all origins) - restrict in production if needed
3. **Authentication**: Admin endpoints require `Authorization: Bearer <token>` header
4. **Public Endpoints**: `customer-balance` and `customer-qr` are public (no auth required)
5. **Rate Limiting**: Supabase has built-in rate limiting for Edge Functions
6. **Logs**: View logs with `supabase functions logs <function-name>`

---

## 🐛 Troubleshooting

### Function Deployment Fails
```bash
# Check your access token
echo $SUPABASE_ACCESS_TOKEN

# Re-link project
supabase link --project-ref mjntmxvknohuqajulgvt

# Try deploying one function at a time
supabase functions deploy admin-login
```

### Function Returns 500 Error
```bash
# View function logs
supabase functions logs admin-login --tail

# Check environment variables are set
supabase secrets list
```

### Frontend Can't Connect
- Verify functions are deployed: `supabase functions list`
- Check CORS headers in function responses
- Verify `VITE_API_URL` in frontend `.env`

### Database Connection Issues
- Supabase Client is automatically configured
- `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` are available by default
- No need to manually configure database connection

---

## 🔄 Making Changes

### Update a Function
1. Edit the function file in `supabase/functions/<function-name>/index.ts`
2. Redeploy: `supabase functions deploy <function-name>`

### Update Shared Code
1. Edit files in `supabase/functions/_shared/`
2. Redeploy ALL functions that use it: `./deploy-functions.sh`

### Add a New Function
```bash
supabase functions new my-new-function
# Edit supabase/functions/my-new-function/index.ts
supabase functions deploy my-new-function
```

---

## ✨ Benefits of Supabase Functions

✅ **Serverless** - No infrastructure management
✅ **Auto-scaling** - Handles traffic spikes automatically
✅ **Global Edge** - Deployed to edge locations worldwide
✅ **Fast Cold Starts** - Deno is optimized for serverless
✅ **Integrated** - Direct access to Supabase database & auth
✅ **Cost-Effective** - Pay only for execution time
✅ **TypeScript Native** - Full TypeScript support
✅ **Easy Deployment** - One command deployment

---

## 📚 Documentation

- Deployment Guide: `supabase/DEPLOY.md`
- Supabase Functions Docs: https://supabase.com/docs/guides/functions
- Deno Docs: https://deno.land/manual

---

**Ready to deploy? Run:**

```bash
export SUPABASE_ACCESS_TOKEN=your-token
cd /home/eshan/production/services/blvq/backend
./deploy-functions.sh
```

**Good luck! 🚀**
