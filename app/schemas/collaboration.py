"""Collaboration (co-authorship) graph schemas."""

from pydantic import BaseModel, Field


class CollabNode(BaseModel):
    id: str
    label: str
    location: str
    papers: int = Field(description="Publication count in catalog")


class CollabEdge(BaseModel):
    source: str
    target: str
    weight: int = Field(description="Number of shared papers")


class CollabEgoResponse(BaseModel):
    center_id: str
    nodes: list[CollabNode]
    edges: list[CollabEdge]
