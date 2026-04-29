from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, HTTPException, Query, Request


DashboardRole = Literal["operator", "manager", "maintenance", "producer", "worker", "supervisor"]

router = APIRouter(tags=["dashboard"])


@router.get("/dashboard")
async def get_dashboard(
    request: Request,
    role: DashboardRole = Query(
        ...,
        description="operator, manager, maintenance, producer, worker, or supervisor",
    ),
) -> dict:
    runtime = request.app.state.runtime
    snapshot = runtime.snapshot()
    summary = runtime.decision_engine.summary()
    reading = snapshot["data"]
    assessment = snapshot["ai_assessment"]
    alerts = snapshot["alerts"]

    if role == "operator":
        return {
            "role": role,
            "live_alerts": alerts["filtered_alerts"],
            "machine_data": reading,
        }

    if role == "manager":
        return {
            "role": role,
            "summary": summary,
            "mission_alerts": alerts["mission_alerts"],
            "machine_data": reading,
        }

    if role == "maintenance":
        return {
            "role": role,
            "diagnostic_insights": runtime.decision_engine.diagnostics(),
            "latest_ai_assessment": assessment,
            "machine_data": reading,
        }

    if role == "producer":
        return {
            "role": role,
            "production_focus": {
                "target_output": "1,200 units/shift",
                "estimated_output": _estimated_output(reading["status"]),
                "line_efficiency": _line_efficiency(assessment["priority_score"]),
                "quality_risk": assessment["priority"],
            },
            "machine_data": reading,
            "blocking_alerts": alerts["mission_alerts"],
        }

    if role == "worker":
        return {
            "role": role,
            "work_instructions": _worker_steps(reading["status"], assessment["priority"]),
            "safe_to_operate": reading["status"] != "critical",
            "nearest_machine": reading["machine_id"],
            "current_alerts": alerts["filtered_alerts"][:5],
            "machine_data": reading,
        }

    if role == "supervisor":
        return {
            "role": role,
            "team_overview": {
                "active_operators": 8,
                "open_alerts": summary["total_alerts"],
                "critical_alerts": summary["critical_count"],
                "escalation_required": bool(alerts["mission_alerts"]),
            },
            "grouped_alerts": alerts["grouped_messages"],
            "priority_queue": alerts["filtered_alerts"][:8],
            "machine_data": reading,
        }

    raise HTTPException(status_code=400, detail="Unsupported dashboard role")


def _estimated_output(status: str) -> str:
    if status == "critical":
        return "720 units/shift"
    if status == "warning":
        return "980 units/shift"
    return "1,160 units/shift"


def _line_efficiency(priority_score: int) -> str:
    efficiency = max(45, 98 - round(priority_score * 0.42))
    return f"{efficiency}%"


def _worker_steps(status: str, priority: str) -> list[str]:
    if status == "critical":
        return [
            "Pause local machine operation.",
            "Notify supervisor and maintenance.",
            "Verify safe distance and wait for clearance.",
        ]
    if priority == "MEDIUM":
        return [
            "Continue operation at reduced attention interval.",
            "Check temperature and vibration panel every 5 minutes.",
            "Log any sound, smell, or vibration change.",
        ]
    return [
        "Continue normal operation.",
        "Confirm guards and indicators are normal.",
        "Report unusual behavior if observed.",
    ]
