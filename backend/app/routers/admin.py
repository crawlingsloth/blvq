"""Admin API endpoints"""
from datetime import timedelta
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from ..database import get_db
from ..models import User, CustomerLink
from ..schemas import (
    AdminLogin,
    Token,
    CustomerLinkCreate,
    CustomerLinkResponse,
    EwityCustomer
)
from ..auth import (
    verify_password,
    create_access_token,
    get_current_admin_user,
    get_password_hash
)
from ..ewity_client import ewity_client
from ..config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/admin", tags=["admin"])


@router.post("/login", response_model=Token)
async def login(credentials: AdminLogin, db: Session = Depends(get_db)):
    """Admin login endpoint"""
    user = db.query(User).filter(User.username == credentials.username).first()

    if not user or not verify_password(credentials.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )

    if user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not authorized"
        )

    access_token_expires = timedelta(minutes=settings.access_token_expire_minutes)
    access_token = create_access_token(
        data={"sub": user.username}, expires_delta=access_token_expires
    )

    return {"access_token": access_token, "token_type": "bearer"}


@router.get("/customers/search", response_model=dict)
async def search_customers(
    q: str,
    page: int = 1,
    current_user: User = Depends(get_current_admin_user)
):
    """Search Ewity customers by name or phone"""
    if len(q) < 2:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Query must be at least 2 characters"
        )

    result = await ewity_client.search_customers(q, page)
    return result


@router.get("/customers/all", response_model=dict)
async def get_all_customers(
    page: int = 1,
    current_user: User = Depends(get_current_admin_user)
):
    """Get all Ewity customers (paginated)"""
    result = await ewity_client.get_all_customers(page)
    return result


@router.post("/customers/link", response_model=CustomerLinkResponse)
async def link_customer(
    link_data: CustomerLinkCreate,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Link a customer to a UUID for balance checking"""
    # Check if customer already linked
    existing = db.query(CustomerLink).filter(
        CustomerLink.ewity_customer_id == link_data.ewity_customer_id
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Customer already linked"
        )

    # Create new link
    new_link = CustomerLink(
        ewity_customer_id=link_data.ewity_customer_id,
        customer_name=link_data.customer_name,
        customer_phone=link_data.customer_phone,
        created_by=current_user.id
    )

    db.add(new_link)
    db.commit()
    db.refresh(new_link)

    return new_link


@router.get("/customers/links", response_model=List[CustomerLinkResponse])
async def get_customer_links(
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Get all linked customers"""
    links = db.query(CustomerLink).order_by(CustomerLink.created_at.desc()).all()
    return links


@router.delete("/customers/link/{uuid}")
async def delete_customer_link(
    uuid: str,
    current_user: User = Depends(get_current_admin_user),
    db: Session = Depends(get_db)
):
    """Remove a customer link"""
    link = db.query(CustomerLink).filter(CustomerLink.uuid == uuid).first()

    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Link not found"
        )

    db.delete(link)
    db.commit()

    return {"message": "Link deleted successfully"}
