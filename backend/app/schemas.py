"""Pydantic schemas for request/response validation"""
from datetime import datetime
from typing import Optional
from pydantic import BaseModel


# Auth schemas
class AdminLogin(BaseModel):
    username: str
    password: str


class Token(BaseModel):
    access_token: str
    token_type: str


class TokenData(BaseModel):
    username: Optional[str] = None


# Customer link schemas
class CustomerLinkCreate(BaseModel):
    ewity_customer_id: int
    customer_name: Optional[str] = None
    customer_phone: Optional[str] = None


class CustomerLinkResponse(BaseModel):
    id: str
    uuid: str
    ewity_customer_id: int
    customer_name: Optional[str]
    customer_phone: Optional[str]
    created_at: datetime
    last_accessed: datetime

    class Config:
        from_attributes = True


# Ewity customer schemas
class EwityCustomer(BaseModel):
    id: int
    name: Optional[str]
    mobile: Optional[str]
    email: Optional[str]
    credit_limit: Optional[float]
    total_outstanding: Optional[float]
    total_spent: Optional[float]
    loyalty_text: Optional[str]


class CustomerBalanceResponse(BaseModel):
    uuid: str
    customer_name: str
    customer_phone: Optional[str]
    credit_limit: float
    total_outstanding: float
    total_spent: float
    loyalty_text: Optional[str]
    last_updated: datetime
