"""Root API router."""

from fastapi import APIRouter

from app.api.routes.ai_features import router as ai_router
from app.api.routes.auth import router as auth_router
from app.api.routes.invites import router as invites_router
from app.api.routes.papers import router as papers_router
from app.api.routes.profiles import router as profiles_router


api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(profiles_router)
api_router.include_router(invites_router)
api_router.include_router(papers_router)
api_router.include_router(ai_router)
