"""Invitation endpoints for growth workflow."""

from datetime import datetime, timedelta
import secrets

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import Invitation, User
from app.db.session import get_db
from app.schemas.invite import AcceptInviteRequest, CreateInviteRequest, InviteResponse


router = APIRouter(prefix="/invites", tags=["Invites"])


@router.post("", response_model=InviteResponse)
def create_invite(
    payload: CreateInviteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    token = secrets.token_urlsafe(32)
    invite = Invitation(
        inviter_user_id=current_user.id,
        invitee_email=payload.invitee_email.lower(),
        token=token,
        status="pending",
        expires_at=datetime.utcnow() + timedelta(days=14),
    )
    db.add(invite)
    db.commit()
    db.refresh(invite)
    return InviteResponse(id=invite.id, invitee_email=invite.invitee_email, status=invite.status, token=invite.token)


@router.post("/accept", response_model=InviteResponse)
def accept_invite(
    payload: AcceptInviteRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    invite = db.query(Invitation).filter(Invitation.token == payload.token).first()
    if not invite:
        raise HTTPException(status_code=404, detail="Invitation token not found")
    if invite.status != "pending":
        raise HTTPException(status_code=409, detail="Invitation already used")
    if invite.expires_at < datetime.utcnow():
        invite.status = "expired"
        db.commit()
        raise HTTPException(status_code=410, detail="Invitation expired")

    invite.status = "accepted"
    invite.accepted_by_user_id = current_user.id
    db.commit()
    db.refresh(invite)
    return InviteResponse(id=invite.id, invitee_email=invite.invitee_email, status=invite.status, token=invite.token)
