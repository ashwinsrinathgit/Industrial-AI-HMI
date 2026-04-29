from __future__ import annotations

from fastapi import APIRouter, HTTPException, Request
from pydantic import BaseModel


router = APIRouter(tags=["alerts"])


class AlertActionRequest(BaseModel):
    actor: str = "APEXVIHAG"


@router.get("/alerts")
async def get_alerts(request: Request) -> dict:
    runtime = request.app.state.runtime
    return {
        "ai_assessment": runtime.latest_ai_assessment,
        **runtime.latest_alerts,
    }


@router.post("/alerts/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, payload: AlertActionRequest, request: Request) -> dict:
    alert = request.app.state.runtime.decision_engine.acknowledge(alert_id, payload.actor)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    request.app.state.runtime.latest_alerts = request.app.state.runtime.decision_engine.latest_bundle
    return {"status": "acknowledged", "alert": alert}


@router.post("/alerts/{alert_id}/resolve")
async def resolve_alert(alert_id: str, payload: AlertActionRequest, request: Request) -> dict:
    alert = request.app.state.runtime.decision_engine.resolve(alert_id, payload.actor)
    if alert is None:
        raise HTTPException(status_code=404, detail="Alert not found")
    request.app.state.runtime.latest_alerts = request.app.state.runtime.decision_engine.latest_bundle
    return {"status": "resolved", "alert": alert}
