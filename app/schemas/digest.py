"""Email digest subscription and preview schemas."""

from datetime import datetime
from typing import Optional

from pydantic import BaseModel, Field


class DigestSubscriptionUpsert(BaseModel):
    enabled: bool = False
    frequency: str = Field(default="weekly")
    query: str = Field(default="", max_length=500)
    country: str = Field(default="All Countries", max_length=120)
    result_type: str = Field(default="All", max_length=80)
    topic: str = Field(default="All Topics", max_length=200)


class DigestSubscriptionResponse(BaseModel):
    enabled: bool
    frequency: str
    query: str
    country: str
    result_type: str
    topic: str
    last_sent_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class DigestPaperItem(BaseModel):
    id: str
    title: str
    year: Optional[int] = None


class DigestResearcherItem(BaseModel):
    id: str
    name: str
    institution: str


class DigestPreviewResponse(BaseModel):
    subject: str
    intro: str
    papers: list[DigestPaperItem]
    researchers: list[DigestResearcherItem]
    html: str
