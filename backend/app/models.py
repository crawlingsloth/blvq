"""SQLAlchemy database models"""
import uuid
from datetime import datetime
from sqlalchemy import Column, String, DateTime, ForeignKey, Integer
from sqlalchemy.orm import relationship
from .database import Base


def generate_uuid():
    return str(uuid.uuid4())


class User(Base):
    __tablename__ = "users"

    id = Column(String, primary_key=True, default=generate_uuid)
    username = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    role = Column(String, nullable=False, default="admin")  # admin or member
    created_at = Column(DateTime, default=datetime.utcnow)

    # Relationships
    customer_links = relationship("CustomerLink", back_populates="created_by_user")


class CustomerLink(Base):
    __tablename__ = "customer_links"

    id = Column(String, primary_key=True, default=generate_uuid)
    uuid = Column(String, unique=True, nullable=False, index=True, default=generate_uuid)
    ewity_customer_id = Column(Integer, nullable=False)
    customer_name = Column(String, nullable=True)  # Cached from Ewity
    customer_phone = Column(String, nullable=True)  # Cached from Ewity
    created_by = Column(String, ForeignKey("users.id"), nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    last_accessed = Column(DateTime, default=datetime.utcnow)

    # Relationships
    created_by_user = relationship("User", back_populates="customer_links")
