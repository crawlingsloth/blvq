# Deploying to Supabase

This guide covers deploying the BLVQ backend to Supabase using different approaches.

## Option 1: Deploy as Docker Container (Recommended)

This approach runs your Express app as a container, giving you full control and minimal code changes.

### 1. Create Dockerfile

A `Dockerfile` is included in this directory. Build and deploy:

```bash
# Build the Docker image
docker build -t blvq-backend .

# Test locally
docker run -p 8987:8987 --env-file .env blvq-backend
```

### 2. Deploy to Supabase

Supabase doesn't directly support Docker containers, but you can:

#### Option A: Deploy to Fly.io or Railway

```bash
# Install Fly.io CLI
curl -L https://fly.io/install.sh | sh

# Deploy
fly launch
fly deploy
```

#### Option B: Use Supabase + External Hosting

1. Keep database on Supabase
2. Host the API on Fly.io, Railway, or Render
3. Configure `DATABASE_URL` to point to Supabase

### 3. Environment Variables

Set these in your hosting platform:

```
DATABASE_URL=postgresql://postgres.mjntmxvknohuqajulgvt:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
SUPABASE_URL=https://mjntmxvknohuqajulgvt.supabase.co
SUPABASE_ANON_KEY=your-supabase-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-supabase-service-role-key-here
JWT_SECRET=your-production-secret
EWITY_API_TOKEN=your-ewity-token
FRONTEND_URL=https://your-frontend.com
```

---

## Option 2: Convert to Supabase Edge Functions (Deno)

Supabase Edge Functions run on Deno. This requires rewriting the code.

### Architecture Changes Needed

1. **Convert to Deno**: Replace Node.js imports with Deno equivalents
2. **Separate Functions**: Each endpoint becomes its own function
3. **Use Supabase Client**: Replace direct PostgreSQL queries with Supabase client

### Example: Converting Admin Login Function

**Original (Node.js):**
```typescript
import { Router } from 'express';
import { db } from '../lib/database.js';

router.post('/login', async (req, res) => {
  const user = await db.getUserByUsername(username);
  // ...
});
```

**Converted (Deno):**
```typescript
// supabase/functions/admin-login/index.ts
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  const supabase = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  );

  const { username, password } = await req.json();

  const { data: user } = await supabase
    .from('blvq__users')
    .select('*')
    .eq('username', username)
    .single();

  // ... rest of logic
});
```

### Steps to Convert

1. **Initialize Supabase CLI:**
   ```bash
   supabase init
   ```

2. **Create function structure:**
   ```bash
   supabase functions new admin-login
   supabase functions new customer-balance
   supabase functions new customer-qr
   # ... etc
   ```

3. **Port each endpoint** to Deno syntax

4. **Deploy:**
   ```bash
   supabase functions deploy admin-login
   supabase functions deploy customer-balance
   # ... etc
   ```

### Considerations

- **More Work**: Complete rewrite from Express to Deno
- **Separate Functions**: Each endpoint is a separate deployment
- **Native Integration**: Better integration with Supabase features
- **Cold Starts**: Faster than Node.js containers

---

## Option 3: Hybrid Approach (Recommended for Production)

Use the best of both worlds:

1. **Database**: Supabase PostgreSQL ✅
2. **API**: Express app on Fly.io/Railway ✅
3. **Functions**: Use Supabase Edge Functions for specific tasks (webhooks, scheduled jobs)

### Benefits

- Keep existing Express code
- Fast deployment (no rewrite needed)
- Use Supabase for database + auth
- Leverage Edge Functions when needed

### Setup

1. **Deploy Express API** (Option 1)
2. **Use Supabase for**:
   - PostgreSQL database
   - Realtime subscriptions (if needed)
   - Storage (if needed)
3. **Create Edge Functions** only for:
   - Scheduled tasks (e.g., nightly customer sync)
   - Webhooks from external services

---

## Recommended Approach

For fastest deployment with minimal changes:

1. ✅ Use **Option 1** (Deploy as Container to Fly.io/Railway)
2. ✅ Keep Supabase for PostgreSQL only
3. ✅ Run setup script locally to initialize database
4. ✅ Deploy Express API to Fly.io

### Quick Fly.io Deployment

```bash
# 1. Install Fly.io CLI
curl -L https://fly.io/install.sh | sh

# 2. Login
fly auth login

# 3. Create app
fly launch

# 4. Set secrets
fly secrets set DATABASE_URL="postgresql://..."
fly secrets set JWT_SECRET="your-secret"
fly secrets set EWITY_API_TOKEN="your-token"
fly secrets set FRONTEND_URL="https://your-app.com"

# 5. Deploy
fly deploy

# 6. Run setup (one time)
fly ssh console
npm run setup -- --sync-customers
exit
```

Your API will be live at `https://your-app.fly.dev` 🚀

---

## Database Setup

Regardless of deployment method, run the setup script once:

```bash
# Locally (before deployment)
npm run setup -- --sync-customers

# Or via SSH after deployment
fly ssh console
npm run setup -- --sync-customers
```

This creates:
- Database tables with `blvq__` prefix
- Admin user
- Syncs customers from Ewity

---

## Troubleshooting

### Connection Issues

Use the **pooler connection** for serverless:
```
postgresql://postgres.mjntmxvknohuqajulgvt:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
```

### CORS Issues

Update CORS origin in `src/index.ts`:
```typescript
res.header('Access-Control-Allow-Origin', 'https://your-frontend.com');
```

### Environment Variables

Ensure all required env vars are set in your hosting platform.
