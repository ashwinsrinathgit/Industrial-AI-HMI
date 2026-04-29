from __future__ import annotations

from datetime import UTC, datetime
from typing import Literal

from fastapi import APIRouter, Request
from pydantic import BaseModel, Field

from ..simulation import MachineReading
from ..templates import get_thresholds


Status = Literal["normal", "warning", "critical"]
class AnalyzeRequest(BaseModel):
    machine_id: str = Field(default="Machine_A", min_length=1)
    temperature: float = Field(ge=0, le=100)
    vibration: float = Field(ge=0.1, le=10.0)
    timestamp: str | None = None


router = APIRouter(tags=["analysis"])


@router.post("/analyze")
async def analyze_reading(payload: AnalyzeRequest, request: Request) -> dict:
    """Run submitted telemetry through the same AI and decision pipeline as live data."""
    reading: MachineReading = {
        "machine_id": payload.machine_id,
        "temperature": round(payload.temperature, 1),
        "vibration": round(payload.vibration, 2),
        "timestamp": payload.timestamp or datetime.now(UTC).isoformat(),
        "status": _status_for(payload.temperature, payload.vibration, payload.machine_id),
        "pattern": "manual_input",
    }

    runtime = request.app.state.runtime
    assessment = runtime.ai_model.assess(reading)
    alerts = runtime.decision_engine.process(reading, assessment)

    runtime.latest_data = reading
    runtime.latest_ai_assessment = assessment
    runtime.latest_alerts = alerts
    runtime.latest_recommendations = runtime.recommendation_engine.recommend(reading, assessment, alerts)
    runtime.manual_hold_until = float("inf")

    return {
        "input": reading,
        "ai_assessment": assessment,
        "alerts": alerts,
        "recommendations": runtime.latest_recommendations,
    }


def _status_for(temperature: float, vibration: float, machine_id: str = "Machine_A") -> Status:
    thresholds = get_thresholds(machine_id)
    if temperature > thresholds["temperature_threshold"] or vibration > thresholds["vibration_threshold"]:
        return "critical"
    if temperature > thresholds["temperature_warning"] or vibration > thresholds["vibration_warning"]:
        return "warning"
    return "normal"
