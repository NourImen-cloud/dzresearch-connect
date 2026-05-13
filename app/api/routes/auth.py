"""Authentication endpoints."""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.security import create_access_token, hash_password, verify_password
from app.db.models import ResearcherProfile, User
from app.db.session import get_db
from app.schemas.auth import AuthResponse, LoginRequest, RegisterRequest, UserMeResponse
from app.services.auth_helpers import (
    normalize_openalex_author_id,
    refresh_listing_and_claim,
    user_has_claimed_profile,
)

router = APIRouter(prefix="/auth", tags=["Auth"])


def _build_auth_response(db: Session, user: User, token: str) -> AuthResponse:
    refresh_listing_and_claim(db, user)
    db.commit()
    db.refresh(user)
    return AuthResponse(
        access_token=token,
        user_id=user.id,
        email=user.email,
        full_name=user.full_name,
        profile_listing_pending=user.profile_listing_pending,
        linked_researcher_id=user.linked_researcher_id,
        profile_claimed=user_has_claimed_profile(db, user),
    )


@router.post("/register", response_model=AuthResponse)
def register(payload: RegisterRequest, db: Session = Depends(get_db)):
    existing = db.query(User).filter(User.email == payload.email.lower()).first()
    if existing:
        raise HTTPException(status_code=409, detail="Email already registered")

    rid = normalize_openalex_author_id(payload.researcher_profile_id)
    linked_id = rid or None
    listing_pending = False

    if rid:
        profile = db.query(ResearcherProfile).filter(ResearcherProfile.id == rid).first()
        if profile:
            if profile.is_claimed and profile.claimed_by_user_id is not None:
                raise HTTPException(
                    status_code=409,
                    detail="This researcher profile is already claimed. Contact support if this is your profile.",
                )
            listing_pending = False
        else:
            listing_pending = True

    user = User(
        full_name=payload.full_name.strip(),
        email=payload.email.lower(),
        password_hash=hash_password(payload.password),
        role="researcher",
        linked_researcher_id=linked_id,
        profile_listing_pending=listing_pending,
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    if rid:
        profile = db.query(ResearcherProfile).filter(ResearcherProfile.id == rid).first()
        if profile:
            profile.is_claimed = True
            profile.claimed_by_user_id = user.id
            db.add(profile)
            db.commit()
            db.refresh(user)

    token = create_access_token(str(user.id))
    return _build_auth_response(db, user, token)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == payload.email.lower()).first()
    if not user or not verify_password(payload.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid email or password")

    token = create_access_token(str(user.id))
    return _build_auth_response(db, user, token)


@router.get("/me", response_model=UserMeResponse)
def me(current_user: User = Depends(get_current_user), db: Session = Depends(get_db)):
    refresh_listing_and_claim(db, current_user)
    db.commit()
    db.refresh(current_user)
    return UserMeResponse(
        user_id=current_user.id,
        email=current_user.email,
        full_name=current_user.full_name,
        profile_listing_pending=current_user.profile_listing_pending,
        linked_researcher_id=current_user.linked_researcher_id,
        profile_claimed=user_has_claimed_profile(db, current_user),
    )
