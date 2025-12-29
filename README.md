# BLVQ Customer Balance System

A complete PWA solution for customers to check their shop credit balance via QR codes.

## 🎯 Project Overview

This system allows:
- **Customers**: Scan QR code → View their outstanding balance instantly
- **Shop Staff (Admin)**: Link customers → Generate unique QR codes
- **Auto-updates**: PWA automatically updates when you deploy new versions

## 📁 Project Structure

```
.
├── backend/          # FastAPI backend service
│   ├── app/
│   │   ├── routers/  # API endpoints
│   │   ├── models.py # Database models
│   │   └── main.py   # FastAPI app
│   └── requirements.txt
│
└── frontend/         # React PWA
    ├── src/
    │   ├── components/ # React components
    │   ├── lib/        # API client
    │   └── types/      # TypeScript types
    └── package.json
```

## 🚀 Quick Start

### Backend Setup

```bash
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env with your settings
uvicorn app.main:app --reload
```

**Default admin login:**
- Username: `admin`
- Password: `admin123`

Backend runs at: http://localhost:8000
API Docs: http://localhost:8000/docs

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

Frontend runs at: http://localhost:5173

## 🌐 Deployment

### Backend (Your Server + Cloudflare Tunnel)

1. Deploy backend to your server
2. Set up Cloudflare tunnel:
   ```bash
   cloudflared tunnel --url http://localhost:8000
   ```
3. Configure tunnel route: `blvq-backend.crawlingsloth.space`

### Frontend (GitHub Pages)

1. Push to GitHub:
   ```bash
   cd frontend
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin YOUR_REPO_URL
   git push -u origin main
   ```

2. Enable GitHub Pages:
   - Settings → Pages → Source: GitHub Actions

3. **Done!** Every push to `main` auto-deploys

4. Configure custom domain:
   - Add `CNAME` file in `frontend/public/` with: `blvq.crawlingsloth.cloud`
   - Configure DNS CNAME record

## ✨ Key Features

### 1. PWA Auto-Update (No Cache Clearing!)

When you push updates to GitHub Pages:
- Service worker detects new version
- Downloads update in background
- Automatically reloads app
- User sees latest version within 60 seconds

**Users never need to clear cache!** 🎉

### 2. Customer Flow

1. Customer asks staff for QR code
2. Scans QR with phone camera
3. Opens PWA in browser
4. Sees balance instantly
5. Can install to home screen
6. Always up-to-date (auto-updates)

### 3. Admin Flow

1. Login to admin dashboard
2. Search customer by name/phone
3. Click "Link Customer"
4. Generate & download QR code
5. Print/share QR with customer

## 🔧 Configuration

### Backend (.env)

```bash
EWITY_API_TOKEN=uat_DuVb2afCHOpEAoihxCCnQWGBcWEF
EWITY_API_BASE_URL=https://api.ewitypos.com/v1
DATABASE_URL=sqlite:///./blvq.db
SECRET_KEY=your-secret-key-change-in-production
FRONTEND_URL=https://blvq.crawlingsloth.cloud
CACHE_TTL_SECONDS=300
```

### Frontend (.env)

```bash
VITE_API_URL=https://blvq-backend.crawlingsloth.space
```

## 📱 Usage

### For Customers:

1. **Scan QR Code**: Use phone camera to scan the QR code from shop
2. **View Balance**: See your credit limit, outstanding balance, and total spent
3. **Install App**: Tap "Add to Home Screen" for quick access
4. **Check Anytime**: Open app anytime to see latest balance

### For Admins:

1. **Login**: Visit `/admin/login` (default: admin/admin123)
2. **Search Customer**: Type name or phone number
3. **Link Customer**: Click customer → Click "Link Customer"
4. **Generate QR**: Click "Show QR" → Download QR code
5. **Share**: Print or share QR code with customer

## 🔐 Security

- ✅ JWT authentication for admin
- ✅ HTTPS required (Cloudflare tunnel + GitHub Pages)
- ✅ CORS configured for specific domains
- ✅ API token only on backend (never exposed)
- ✅ Rate limiting via caching (5 min TTL)

## 📊 API Endpoints

### Admin (Authenticated)

- `POST /api/admin/login` - Admin login
- `GET /api/admin/customers/search?q={query}` - Search customers
- `POST /api/admin/customers/link` - Link customer to UUID
- `GET /api/admin/customers/links` - List all linked customers
- `DELETE /api/admin/customers/link/{uuid}` - Remove link

### Customer (Public)

- `GET /api/customer/{uuid}` - Get balance by UUID
- `GET /api/customer/{uuid}/qr` - Get QR code image

## 🎨 Tech Stack

### Backend
- FastAPI (Python)
- SQLAlchemy + SQLite
- JWT authentication
- QR code generation
- Rate-limited caching

### Frontend
- React 18 + TypeScript
- Vite + PWA plugin
- Tailwind CSS
- React Query
- React Router

## 🧪 Testing

### Test Backend:
```bash
cd backend
source venv/bin/activate
python -m pytest  # (add tests as needed)
```

### Test Frontend:
```bash
cd frontend
npm run build     # Build for production
npm run preview   # Test production build
```

### Test PWA Auto-Update:
1. Deploy version 1
2. Make a small change (e.g., change a color)
3. Deploy version 2
4. Open app on phone
5. Wait 60 seconds → App auto-updates!

## 🐛 Troubleshooting

### Backend Issues

**Database errors:**
```bash
rm blvq.db  # Delete database
# Restart app to recreate
```

**CORS errors:**
- Check `FRONTEND_URL` in `.env`
- Verify frontend domain matches

### Frontend Issues

**PWA not installing:**
- Ensure HTTPS is enabled
- Check manifest.json loads
- Verify icons are present

**Auto-update not working:**
- Check service worker in DevTools
- Ensure `registerType: 'autoUpdate'` in vite.config.ts
- Wait 60 seconds for update check

**API connection errors:**
- Verify `VITE_API_URL` is correct
- Check backend is running
- Check CORS configuration

## 📚 Documentation

- [Backend README](./backend/README.md)
- [Frontend README](./frontend/README.md)
- [Ewity API Summary](./EWITY_API_SUMMARY.md)

## 🔄 Development Workflow

1. Make changes to backend or frontend
2. Test locally
3. Commit and push to GitHub
4. Frontend auto-deploys via GitHub Actions
5. Backend: deploy to your server
6. Users get updates automatically!

## 📝 Notes

- Default admin credentials: `admin` / `admin123` (change immediately!)
- Customer balance data cached for 5 minutes
- QR codes contain UUID, not sensitive data
- PWA works offline with last cached data
- Compatible with all modern browsers including iOS Safari

## 🎯 Production Checklist

Before going live:

- [ ] Change default admin password
- [ ] Generate secure `SECRET_KEY` for backend
- [ ] Set up Cloudflare tunnel for backend
- [ ] Configure custom domain for frontend
- [ ] Enable HTTPS on both backend and frontend
- [ ] Test PWA installation on real devices
- [ ] Test auto-update functionality
- [ ] Create backup of SQLite database

## 🆘 Support

For issues or questions:
1. Check troubleshooting section above
2. Review API documentation at `/docs`
3. Check browser console for errors

## 📄 License

MIT

---

**Built with ❤️ for BLVQ**
