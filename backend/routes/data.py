from __future__ import annotations

from fastapi import APIRouter, Request


router = APIRouter(tags=["data"])


@router.get("/data")
async def get_latest_data(request: Request) -> dict:
    return request.app.state.runtime.latest_data
