# BLVQ Customer Balance API - Backend

FastAPI backend service for BLVQ customer balance PWA.

## Features

- Admin authentication with JWT
- Customer search from Ewity POS
- Customer linking with UUID generation
- QR code generation
- Balance checking API
- Rate-limited caching (5 min TTL)

## Setup

### 1. Install Dependencies

```bash
cd backend
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. Configure Environment

```bash
cp .env.example .env
# Edit .env and set your configuration
```

**Important:** Change the `SECRET_KEY` in production!

### 3. Run the Server

```bash
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

The API will be available at `http://localhost:8000`

## API Documentation

Once running, visit:
- **Swagger UI:** http://localhost:8000/docs
- **ReDoc:** http://localhost:8000/redoc

## Default Admin Credentials

- **Username:** `admin`
- **Password:** `admin123`

**⚠️ Change these immediately in production!**

## Deployment

### With Cloudflare Tunnel

1. Install cloudflared
2. Configure tunnel:
   ```bash
   cloudflared tunnel --url http://localhost:8000
   ```
3. Set up tunnel route to `blvq-backend.crawlingsloth.space`

### Production Configuration

1. Generate secure SECRET_KEY:
   ```python
   import secrets
   print(secrets.token_urlsafe(32))
   ```

2. Update .env with production values

3. Run with production server:
   ```bash
   uvicorn app.main:app --host 0.0.0.0 --port 8000
   ```

4. Consider using systemd or supervisor for process management

## API Endpoints

### Admin Endpoints (Require Auth)

- `POST /api/admin/login` - Login
- `GET /api/admin/customers/search?q={query}` - Search customers
- `GET /api/admin/customers/all?page={page}` - Get all customers
- `POST /api/admin/customers/link` - Link customer
- `GET /api/admin/customers/links` - List links
- `DELETE /api/admin/customers/link/{uuid}` - Remove link

### Customer Endpoints (Public)

- `GET /api/customer/{uuid}` - Get balance
- `GET /api/customer/{uuid}/qr` - Get QR code image

## Database

SQLite database (`blvq.db`) is created automatically on first run.

### Tables

- **users** - Admin users
- **customer_links** - Customer UUID mappings

## Caching

Customer data is cached for 5 minutes to reduce Ewity API calls.

## Development

### Run Tests

```bash
pytest
```

### Code Style

```bash
black app/
flake8 app/
```

## Troubleshooting

### Database Issues

Delete `blvq.db` and restart to recreate tables.

### CORS Errors

Ensure `FRONTEND_URL` in .env matches your frontend domain.

### Ewity API Errors

Check that `EWITY_API_TOKEN` is valid and not expired.
