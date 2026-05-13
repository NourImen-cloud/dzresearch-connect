"""Schemas for papers."""

from typing import Optional

from pydantic import BaseModel


class PaperResponse(BaseModel):
    id: str
    title: str
    abstract: str
    year: Optional[int] = None
    concepts: str

    class Config:
        from_attributes = True

