"""Customer API endpoints (public)"""
from datetime import datetime
from io import BytesIO
from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.responses import StreamingResponse
from sqlalchemy.orm import Session
import qrcode
from ..database import get_db
from ..models import CustomerLink
from ..schemas import CustomerBalanceResponse
from ..ewity_client import ewity_client
from ..config import get_settings

settings = get_settings()
router = APIRouter(prefix="/api/customer", tags=["customer"])


@router.get("/{uuid}", response_model=CustomerBalanceResponse)
async def get_customer_balance(uuid: str, db: Session = Depends(get_db)):
    """Get customer balance by UUID (public endpoint)"""
    # Find the link
    link = db.query(CustomerLink).filter(CustomerLink.uuid == uuid).first()

    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )

    # Update last accessed
    link.last_accessed = datetime.utcnow()
    db.commit()

    # Fetch FRESH customer data directly from Ewity API (bypass database cache)
    # Use cached page number for faster lookup
    customer_data = None
    found_page = None

    try:
        # If we have a cached page number, check that page first
        if link.last_api_page:
            print(f"Checking cached page {link.last_api_page} for customer {link.ewity_customer_id}")
            data = await ewity_client._get("/customers", params={"page": link.last_api_page})
            customers = data.get("data", [])

            for c in customers:
                if c.get("id") == link.ewity_customer_id:
                    customer_data = c
                    found_page = link.last_api_page
                    print(f"✓ Found on cached page {found_page}")
                    break

        # If not found on cached page, search all pages
        if not customer_data:
            print(f"Customer not on cached page, searching all pages...")
            for page in range(1, 14):
                # Skip the cached page since we already checked it
                if page == link.last_api_page:
                    continue

                data = await ewity_client._get("/customers", params={"page": page})
                customers = data.get("data", [])

                for c in customers:
                    if c.get("id") == link.ewity_customer_id:
                        customer_data = c
                        found_page = page
                        print(f"✓ Found customer on page {page}")
                        break

                if customer_data:
                    break

        # Update cached page number if found
        if found_page and found_page != link.last_api_page:
            link.last_api_page = found_page
            print(f"Updated cached page to {found_page}")

    except Exception as e:
        print(f"Error fetching fresh data: {e}")

    # Final fallback to database if API search fails
    if not customer_data:
        print(f"Could not find in API, using database cache")
        customer_data = await ewity_client.get_customer(link.ewity_customer_id, db)

    if not customer_data:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer data not available"
        )

    # Return balance info
    return CustomerBalanceResponse(
        uuid=link.uuid,
        customer_name=customer_data.get("name", link.customer_name or "Unknown"),
        customer_phone=customer_data.get("mobile", link.customer_phone),
        credit_limit=customer_data.get("credit_limit", 0) or 0,
        total_outstanding=customer_data.get("total_outstanding", 0) or 0,
        total_spent=customer_data.get("total_spent", 0) or 0,
        loyalty_text=customer_data.get("loyalty_text"),
        last_updated=datetime.utcnow()
    )


@router.get("/{uuid}/qr")
async def get_qr_code(uuid: str, db: Session = Depends(get_db)):
    """Generate QR code for customer UUID"""
    # Verify link exists
    link = db.query(CustomerLink).filter(CustomerLink.uuid == uuid).first()

    if not link:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )

    # Generate QR code
    url = f"{settings.frontend_url}/balance/{uuid}"

    qr = qrcode.QRCode(
        version=1,
        error_correction=qrcode.constants.ERROR_CORRECT_L,
        box_size=10,
        border=4,
    )
    qr.add_data(url)
    qr.make(fit=True)

    img = qr.make_image(fill_color="black", back_color="white")

    # Convert to bytes
    buf = BytesIO()
    img.save(buf, format='PNG')
    buf.seek(0)

    return StreamingResponse(buf, media_type="image/png")
