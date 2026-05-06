"""Researcher profile endpoints including claim flow."""

from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import ResearcherProfile, User
from app.db.session import get_db
from app.schemas.profile import ClaimProfileRequest, ProfileResponse, ProfileUpdateRequest


router = APIRouter(prefix="/profiles", tags=["Profiles"])


@router.get("", response_model=List[ProfileResponse])
def list_profiles(
    q: Optional[str] = Query(default=None),
    location: Optional[str] = Query(default=None),
    claimed: Optional[bool] = Query(default=None),
    db: Session = Depends(get_db),
):
    query = db.query(ResearcherProfile)
    if q:
        like = f"%{q.lower()}%"
        query = query.filter(ResearcherProfile.name.ilike(like))
    if location:
        query = query.filter(ResearcherProfile.location.ilike(location))
    if claimed is not None:
        query = query.filter(ResearcherProfile.is_claimed == claimed)
    return query.limit(300).all()


@router.get("/by-id/{researcher_id:path}", response_model=ProfileResponse)
def get_profile(researcher_id: str, db: Session = Depends(get_db)):
    profile = db.query(ResearcherProfile).filter(ResearcherProfile.id == researcher_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Researcher profile not found")
    return profile


@router.patch("/by-id/{researcher_id:path}", response_model=ProfileResponse)
def update_profile(
    researcher_id: str,
    payload: ProfileUpdateRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(ResearcherProfile).filter(ResearcherProfile.id == researcher_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Researcher profile not found")
    if not profile.is_claimed or profile.claimed_by_user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only claimer can edit this profile")

    if payload.bio is not None:
        profile.bio = payload.bio
    if payload.specialty is not None:
        profile.specialty = payload.specialty
    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)
    return profile


@router.post("/claim", response_model=ProfileResponse)
def claim_profile(
    payload: ClaimProfileRequest,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    profile = db.query(ResearcherProfile).filter(ResearcherProfile.id == payload.researcher_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Researcher profile not found")
    if profile.is_claimed and profile.claimed_by_user_id != current_user.id:
        raise HTTPException(status_code=409, detail="Profile already claimed by another user")

    profile.is_claimed = True
    profile.claimed_by_user_id = current_user.id
    profile.updated_at = datetime.utcnow()
    db.commit()
    db.refresh(profile)
    return profile
