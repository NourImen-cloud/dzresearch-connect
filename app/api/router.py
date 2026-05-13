"""Root API router."""

from fastapi import APIRouter

from app.api.routes.ai_features import router as ai_router
from app.api.routes.auth import router as auth_router
from app.api.routes.collaboration import router as collaboration_router
from app.api.routes.digests import router as digests_router
from app.api.routes.invites import router as invites_router
from app.api.routes.papers import router as papers_router
from app.api.routes.profiles import router as profiles_router
from app.api.routes.saved_searches import router as saved_searches_router


api_router = APIRouter()
api_router.include_router(auth_router)
api_router.include_router(profiles_router)
api_router.include_router(saved_searches_router)
api_router.include_router(digests_router)
api_router.include_router(collaboration_router)
api_router.include_router(invites_router)
api_router.include_router(papers_router)
api_router.include_router(ai_router)
