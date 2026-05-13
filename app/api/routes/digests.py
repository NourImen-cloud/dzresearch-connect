"""Digest subscription, preview, and optional email delivery."""

from datetime import datetime, timedelta

from typing import Optional

from fastapi import APIRouter, Depends, Header, HTTPException
from sqlalchemy.orm import Session

from app.api.deps import get_current_user
from app.core.config import DIGEST_CRON_SECRET
from app.db.models import DigestSubscription, User
from app.db.session import get_db
from app.schemas.digest import (
    DigestPreviewResponse,
    DigestSubscriptionResponse,
    DigestSubscriptionUpsert,
)
from app.services.digest_builder import build_digest_preview
from app.services.email_send import send_html_email, smtp_configured

router = APIRouter(prefix="/digests", tags=["Digests"])


def _defaults() -> DigestSubscriptionResponse:
    return DigestSubscriptionResponse(
        enabled=False,
        frequency="off",
        query="",
        country="All Countries",
        result_type="All",
        topic="All Topics",
        last_sent_at=None,
        updated_at=None,
    )


@router.get("/subscription", response_model=DigestSubscriptionResponse)
def get_digest_subscription(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sub = (
        db.query(DigestSubscription)
        .filter(DigestSubscription.user_id == current_user.id)
        .first()
    )
    if not sub:
        return _defaults()
    return DigestSubscriptionResponse.model_validate(sub)


@router.put("/subscription", response_model=DigestSubscriptionResponse)
def upsert_digest_subscription(
    payload: DigestSubscriptionUpsert,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if payload.frequency not in ("weekly", "off"):
        raise HTTPException(status_code=400, detail="frequency must be 'weekly' or 'off'")

    sub = (
        db.query(DigestSubscription)
        .filter(DigestSubscription.user_id == current_user.id)
        .first()
    )
    now = datetime.utcnow()
    if not sub:
        sub = DigestSubscription(
            user_id=current_user.id,
            enabled=payload.enabled,
            frequency=payload.frequency,
            query=payload.query or "",
            country=payload.country or "All Countries",
            result_type=payload.result_type or "All",
            topic=payload.topic or "All Topics",
            created_at=now,
            updated_at=now,
        )
        db.add(sub)
    else:
        sub.enabled = payload.enabled
        sub.frequency = payload.frequency
        sub.query = payload.query or ""
        sub.country = payload.country or "All Countries"
        sub.result_type = payload.result_type or "All"
        sub.topic = payload.topic or "All Topics"
        sub.updated_at = now
    db.commit()
    db.refresh(sub)
    return DigestSubscriptionResponse.model_validate(sub)


@router.get("/preview", response_model=DigestPreviewResponse)
def preview_digest(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    sub = (
        db.query(DigestSubscription)
        .filter(DigestSubscription.user_id == current_user.id)
        .first()
    )
    if not sub:
        return build_digest_preview(db, "", "All Countries", "All", "All Topics")
    return build_digest_preview(
        db,
        sub.query,
        sub.country,
        sub.result_type,
        sub.topic,
    )


@router.post("/send-test")
def send_test_digest(
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    if not smtp_configured():
        raise HTTPException(
            status_code=503,
            detail="Email is not configured. Set SMTP_HOST, SMTP_FROM_EMAIL (or SMTP_FROM), SMTP_USER, SMTP_PASSWORD in environment or a .env file at the project root.",
        )
    sub = (
        db.query(DigestSubscription)
        .filter(DigestSubscription.user_id == current_user.id)
        .first()
    )
    preview = (
        build_digest_preview(db, sub.query, sub.country, sub.result_type, sub.topic)
        if sub
        else build_digest_preview(db, "", "All Countries", "All", "All Topics")
    )
    ok, msg = send_html_email(
        current_user.email,
        f"[Test] {preview.subject}",
        preview.html,
        text_fallback=preview.intro,
    )
    if not ok:
        raise HTTPException(status_code=502, detail=msg)
    return {"success": True, "detail": "Test digest sent to your account email."}


@router.post("/cron/send-due")
def cron_send_due_digests(
    db: Session = Depends(get_db),
    x_cron_secret: Optional[str] = Header(default=None, alias="X-Cron-Secret"),
):
    if not DIGEST_CRON_SECRET or x_cron_secret != DIGEST_CRON_SECRET:
        raise HTTPException(status_code=403, detail="Invalid or missing X-Cron-Secret")

    if not smtp_configured():
        raise HTTPException(status_code=503, detail="SMTP not configured")

    now = datetime.utcnow()
    week_ago = now - timedelta(days=7)
    q = db.query(DigestSubscription).filter(
        DigestSubscription.enabled == True,  # noqa: E712
        DigestSubscription.frequency == "weekly",
    )
    sent = 0
    errors: list[str] = []
    for sub in q.all():
        if sub.last_sent_at and sub.last_sent_at > week_ago:
            continue
        user = db.query(User).filter(User.id == sub.user_id).first()
        if not user:
            continue
        preview = build_digest_preview(db, sub.query, sub.country, sub.result_type, sub.topic)
        ok, msg = send_html_email(
            user.email,
            preview.subject,
            preview.html,
            text_fallback=preview.intro,
        )
        if ok:
            sub.last_sent_at = now
            sub.updated_at = now
            sent += 1
        else:
            errors.append(f"user {user.id}: {msg}")
    db.commit()
    return {"sent": sent, "errors": errors}
