"""Schemas for invitations."""

from pydantic import BaseModel, EmailStr


class CreateInviteRequest(BaseModel):
    invitee_email: EmailStr


class AcceptInviteRequest(BaseModel):
    token: str


class InviteResponse(BaseModel):
    id: int
    invitee_email: EmailStr
    status: str
    token: str
