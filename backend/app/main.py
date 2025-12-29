"""FastAPI main application"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from .database import engine, Base, SessionLocal
from .routers import admin, customer
from .config import get_settings
from .models import User
from .auth import get_password_hash

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup and shutdown events"""
    # Create database tables
    Base.metadata.create_all(bind=engine)

    # Create default admin user if none exists
    db = SessionLocal()
    try:
        admin_user = db.query(User).filter(User.role == "admin").first()
        if not admin_user:
            default_admin = User(
                username=settings.admin_username,
                password_hash=get_password_hash(settings.admin_password),
                role="admin"
            )
            db.add(default_admin)
            db.commit()
            print(f"✓ Created default admin user: {settings.admin_username}")
            print(f"  Change password in production via .env!")
    finally:
        db.close()

    yield

    # Shutdown: cleanup if needed
    print("Shutting down...")


# Create FastAPI app
app = FastAPI(
    title="BLVQ Customer Balance API",
    description="Backend API for BLVQ customer balance PWA",
    version="1.0.0",
    lifespan=lifespan
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "http://localhost:5173",  # Vite dev server
        "http://localhost:4173",  # Vite preview
        "https://blvq.crawlingsloth.cloud",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(admin.router)
app.include_router(customer.router)


@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "BLVQ Customer Balance API",
        "version": "1.0.0",
        "docs": "/docs"
    }


@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {"status": "healthy"}
