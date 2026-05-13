"""Persisted search filters per user."""

from fastapi import APIRouter, Depends, HTTPException, Response
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.db.models import SavedSearch, User
from app.db.session import get_db
from app.schemas.saved_search import SavedSearchCreate, SavedSearchResponse

router = APIRouter(prefix="/saved-searches", tags=["Saved searches"])


@router.get("", response_model=list[SavedSearchResponse])
def list_saved_searches(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    return (
        db.query(SavedSearch)
        .filter(SavedSearch.user_id == current_user.id)
        .order_by(SavedSearch.created_at.desc())
        .all()
    )


@router.post("", response_model=SavedSearchResponse)
def create_saved_search(
    payload: SavedSearchCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = SavedSearch(
        user_id=current_user.id,
        name=payload.name.strip(),
        query=payload.query or "",
        country=payload.country or "All Countries",
        result_type=payload.result_type or "All",
        topic=payload.topic or "All Topics",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return row


@router.delete("/{search_id}", status_code=204)
def delete_saved_search(
    search_id: int,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    row = (
        db.query(SavedSearch)
        .filter(SavedSearch.id == search_id, SavedSearch.user_id == current_user.id)
        .first()
    )
    if not row:
        raise HTTPException(status_code=404, detail="Saved search not found")
    db.delete(row)
    db.commit()
    return Response(status_code=204)
