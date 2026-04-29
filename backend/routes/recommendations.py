from __future__ import annotations

from fastapi import APIRouter, Query, Request


router = APIRouter(tags=["recommendations"])


@router.get("/recommendations")
async def get_recommendations(
    request: Request,
    machine_id: str = Query(default="Machine_A", min_length=1),
) -> dict:
    runtime = request.app.state.runtime
    recommendations = runtime.latest_recommendations
    if runtime.latest_data["machine_id"] != machine_id:
        recommendations = [
            item for item in recommendations if item["machine_id"] == machine_id
        ]
    return {
        "machine_id": machine_id,
        "recommendations": recommendations,
        "ai_assessment": runtime.latest_ai_assessment,
    }
