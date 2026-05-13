"""Schemas for researcher profiles and claims."""

from typing import Optional

from pydantic import BaseModel, Field


class ProfileUpdateRequest(BaseModel):
    bio: Optional[str] = Field(default=None, max_length=2000)
    specialty: Optional[str] = Field(default=None, max_length=300)
    website: Optional[str] = Field(default=None, max_length=500)
    orcid: Optional[str] = Field(default=None, max_length=80)


class ClaimProfileRequest(BaseModel):
    researcher_id: str


class ProfileResponse(BaseModel):
    id: str
    name: str
    location: str
    institution: str
    country: str
    h_index: int = 0
    citations: int = 0
    paper_count: int = 0
    topics: str
    bio: str
    specialty: str
    website: str = ""
    orcid: str = ""
    is_claimed: bool
    claimed_by_user_id: Optional[int] = None

    class Config:
        from_attributes = True
