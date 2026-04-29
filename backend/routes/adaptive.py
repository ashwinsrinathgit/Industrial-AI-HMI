from __future__ import annotations

from typing import Any

from fastapi import APIRouter
from pydantic import BaseModel

from ..hmi_generator import generate_custom_hmi, generate_hmi
from ..templates import CONFIG, MACHINE_METADATA, SIGNAL_TEMPLATES, recommend_thresholds, update_config


router = APIRouter(tags=["adaptive-hmi"])


class ConfigUpdate(BaseModel):
    active_template: str | None = None
    temperature_threshold: float | None = None
    vibration_threshold: float | None = None
    temperature_warning: float | None = None
    vibration_warning: float | None = None
    auto_hide_low_priority: bool | None = None
    focus_critical_only: bool | None = None


class HistoryPayload(BaseModel):
    history: list[dict[str, Any]]


class GenerateHmiPayload(BaseModel):
    machine_type: str = "CNC"
    signals: list[str] = ["temperature", "vibration"]


@router.get("/generate-hmi/{machine_type}")
async def get_generated_hmi(machine_type: str) -> dict:
    return generate_hmi(machine_type)


@router.post("/generate-hmi")
async def post_generated_hmi(payload: GenerateHmiPayload) -> dict:
    return generate_custom_hmi(payload.machine_type, payload.signals)


@router.get("/config")
async def get_config() -> dict:
    return {
        "config": CONFIG,
        "templates": SIGNAL_TEMPLATES,
        "machine_metadata": MACHINE_METADATA,
    }


@router.post("/config/update")
async def update_runtime_config(payload: ConfigUpdate) -> dict:
    return {"config": update_config(payload.model_dump(exclude_unset=True))}


@router.post("/ai/recommend")
async def recommend_ai_thresholds(payload: HistoryPayload) -> dict:
    return recommend_thresholds(payload.history)
