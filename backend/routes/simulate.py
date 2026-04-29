from __future__ import annotations

from fastapi import APIRouter, Request


router = APIRouter(tags=["simulation"])


@router.get("/simulate")
async def simulate_reading(request: Request) -> dict:
    """Generate one raw industrial telemetry event without hiding the source data."""
    snapshot = await request.app.state.runtime.advance()
    return {"raw_data": snapshot["data"]}
