"""Pydantic schemas for authentication."""

from typing import Optional

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=200)
    email: EmailStr
    password: str = Field(min_length=6, max_length=128)
    researcher_profile_id: Optional[str] = Field(
        default=None,
        max_length=500,
        description="OpenAlex author URL or id (e.g. https://openalex.org/A1234567890)",
    )


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class AuthResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    user_id: int
    email: EmailStr
    full_name: str = ""
    profile_listing_pending: bool = False
    linked_researcher_id: Optional[str] = None
    profile_claimed: bool = False


class UserMeResponse(BaseModel):
    user_id: int
    email: EmailStr
    full_name: str
    profile_listing_pending: bool = False
    linked_researcher_id: Optional[str] = None
    profile_claimed: bool = False
