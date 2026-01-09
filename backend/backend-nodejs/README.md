# BLVQ Backend - Node.js/TypeScript

Node.js/TypeScript backend for BLVQ, migrated from Python FastAPI. Designed to run as Supabase Functions with PostgreSQL.

## Features

- ✅ Express.js REST API
- ✅ PostgreSQL database with `blvq__` prefixed tables
- ✅ JWT authentication
- ✅ PostgreSQL-based caching (replaces in-memory cache)
- ✅ Ewity POS API integration
- ✅ QR code generation
- ✅ Fully typed with TypeScript

## Prerequisites

- Node.js 18+
- PostgreSQL (Supabase)
- Ewity API credentials

## Setup

### 1. Install Dependencies

```bash
cd backend-nodejs
npm install
```

### 2. Configure Environment

Copy `.env.example` to `.env` and fill in your credentials:

```bash
cp .env.example .env
```

Edit `.env` with your actual values:
- `DATABASE_URL` - Your Supabase PostgreSQL connection string
- `EWITY_API_TOKEN` - Your Ewity API token
- `JWT_SECRET` - A secure random string
- Other configuration values

### 3. Run Setup Script

This will:
- Test database connection
- Create database tables (with `blvq__` prefix)
- Create admin user
- Optionally sync customers from Ewity

```bash
npm run setup
```

To sync customers during setup:

```bash
npm run setup -- --sync-customers
```

### 4. Start Development Server

```bash
npm run dev
```

The API will be available at `http://localhost:8987`

## API Endpoints

### Public Endpoints

- `GET /` - API information
- `GET /health` - Health check
- `GET /api/customer/:uuid` - Get customer balance by UUID
- `GET /api/customer/:uuid/qr` - Generate QR code for customer

### Admin Endpoints (require authentication)

- `POST /api/admin/login` - Admin login
- `GET /api/admin/customers/search?q=query` - Search customers
- `GET /api/admin/customers/all?page=1` - Get all customers (paginated)
- `POST /api/admin/customers/link` - Link customer to UUID
- `GET /api/admin/customers/links` - Get all customer links
- `DELETE /api/admin/customers/link/:uuid` - Delete customer link
- `POST /api/admin/customers/refresh` - Sync customers from Ewity API

### Authentication

Admin endpoints require a Bearer token:

```bash
# Login
curl -X POST http://localhost:8987/api/admin/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "changeme123"}'

# Use the returned token
curl http://localhost:8987/api/admin/customers/all \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"
```

## Database Schema

All tables are prefixed with `blvq__`:

- `blvq__users` - Admin users
- `blvq__customers` - Cached customer data from Ewity
- `blvq__customer_links` - UUID links for customer balance access
- `blvq__cache` - PostgreSQL-based cache

## Deployment to Supabase

### Option 1: As a Container (Recommended for Express apps)

1. Create a `Dockerfile` in the backend-nodejs directory
2. Deploy to Supabase as a container service
3. Connect to your Supabase PostgreSQL instance

### Option 2: Adapt to Supabase Edge Functions

Supabase Edge Functions use Deno. To adapt this Express app:

1. Convert each route to a separate Edge Function
2. Replace Node.js-specific imports with Deno equivalents
3. Use Supabase client instead of direct PostgreSQL connection

See `SUPABASE_DEPLOYMENT.md` for detailed instructions.

## Development

### Build TypeScript

```bash
npm run build
```

### Type Check

```bash
npm run type-check
```

### Run Production Build

```bash
npm run build
npm start
```

## Project Structure

```
backend-nodejs/
├── src/
│   ├── index.ts              # Express app entry point
│   ├── config.ts             # Environment configuration
│   ├── types.ts              # TypeScript type definitions
│   ├── lib/
│   │   ├── database.ts       # PostgreSQL connection & queries
│   │   ├── auth.ts           # JWT & password hashing
│   │   ├── cache.ts          # PostgreSQL-based cache
│   │   └── ewity-client.ts   # Ewity API client
│   ├── functions/
│   │   ├── admin.ts          # Admin API routes
│   │   └── customer.ts       # Customer API routes
│   └── scripts/
│       └── setup.ts          # Database setup script
├── package.json
├── tsconfig.json
├── .env.example
└── README.md
```

## Migration from Python Backend

This Node.js backend is a 1:1 port of the Python FastAPI backend with these changes:

1. **Database**: SQLite → PostgreSQL (Supabase)
2. **Cache**: In-memory → PostgreSQL-based
3. **Startup Logic**: Lifespan events → Setup script
4. **Cold Starts**: ~2-3s (Python) → ~100-500ms (Node.js)

All API endpoints maintain the same contracts as the Python version.

## Troubleshooting

### Database Connection Issues

Ensure your `DATABASE_URL` is correct and uses the pooler connection for serverless:

```
postgresql://postgres.mjntmxvknohuqajulgvt:[PASSWORD]@aws-1-ap-south-1.pooler.supabase.com:6543/postgres
```

### Ewity API Errors

Check that:
- `EWITY_API_TOKEN` is valid
- `EWITY_API_BASE_URL` is correct
- You have network access to the Ewity API

### JWT Errors

Make sure `JWT_SECRET` is set to a secure random string (not the default from `.env.example`)

## License

MIT
