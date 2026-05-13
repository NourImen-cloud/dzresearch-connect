"""Saved search schemas."""

from datetime import datetime

from pydantic import BaseModel, Field


class SavedSearchCreate(BaseModel):
    name: str = Field(min_length=1, max_length=200)
    query: str = Field(default="", max_length=500)
    country: str = Field(default="All Countries", max_length=120)
    result_type: str = Field(default="All", max_length=80)
    topic: str = Field(default="All Topics", max_length=200)


class SavedSearchResponse(BaseModel):
    id: int
    name: str
    query: str
    country: str
    result_type: str
    topic: str
    created_at: datetime

    class Config:
        from_attributes = True
