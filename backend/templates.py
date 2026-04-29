from __future__ import annotations

from statistics import mean
from typing import Any


SIGNAL_TEMPLATES: dict[str, dict[str, Any]] = {
    "motor_standard": {
        "temperature_threshold": 85.0,
        "vibration_threshold": 3.0,
        "temperature_warning": 75.0,
        "vibration_warning": 2.2,
        "layout": "grid",
        "widgets": ["temperature", "vibration", "priority", "alerts"],
    },
    "high_precision_motor": {
        "temperature_threshold": 78.0,
        "vibration_threshold": 2.4,
        "temperature_warning": 70.0,
        "vibration_warning": 1.8,
        "layout": "grid",
        "widgets": ["temperature", "vibration", "confidence", "diagnostics"],
    },
    "pump_standard": {
        "temperature_threshold": 82.0,
        "vibration_threshold": 3.3,
        "temperature_warning": 72.0,
        "vibration_warning": 2.5,
        "layout": "stack",
        "widgets": ["vibration", "temperature", "alerts", "maintenance"],
    },
}


MACHINE_METADATA: dict[str, dict[str, Any]] = {
    "Machine_A": {
        "type": "motor_standard",
        "location": "Line 1 / Cell A",
        "criticality": "high",
    },
    "Machine_B": {
        "type": "high_precision_motor",
        "location": "Line 2 / Precision Bay",
        "criticality": "critical",
    },
    "Machine_C": {
        "type": "pump_standard",
        "location": "Utilities / Pump Room",
        "criticality": "medium",
    },
}


CONFIG: dict[str, Any] = {
    "active_template": "motor_standard",
    "temperature_threshold": SIGNAL_TEMPLATES["motor_standard"]["temperature_threshold"],
    "vibration_threshold": SIGNAL_TEMPLATES["motor_standard"]["vibration_threshold"],
    "temperature_warning": SIGNAL_TEMPLATES["motor_standard"]["temperature_warning"],
    "vibration_warning": SIGNAL_TEMPLATES["motor_standard"]["vibration_warning"],
    "auto_hide_low_priority": True,
    "focus_critical_only": False,
}


def get_machine_metadata(machine_id: str) -> dict[str, Any]:
    return MACHINE_METADATA.get(
        machine_id,
        {
            "type": CONFIG["active_template"],
            "location": "Unassigned",
            "criticality": "medium",
        },
    )


def get_thresholds(machine_id: str | None = None) -> dict[str, float]:
    metadata = get_machine_metadata(machine_id or "")
    template = SIGNAL_TEMPLATES.get(metadata["type"], SIGNAL_TEMPLATES[CONFIG["active_template"]])
    return {
        "temperature_threshold": float(CONFIG.get("temperature_threshold", template["temperature_threshold"])),
        "vibration_threshold": float(CONFIG.get("vibration_threshold", template["vibration_threshold"])),
        "temperature_warning": float(CONFIG.get("temperature_warning", template["temperature_warning"])),
        "vibration_warning": float(CONFIG.get("vibration_warning", template["vibration_warning"])),
    }


def update_config(values: dict[str, Any]) -> dict[str, Any]:
    for key in (
        "active_template",
        "temperature_threshold",
        "vibration_threshold",
        "temperature_warning",
        "vibration_warning",
        "auto_hide_low_priority",
        "focus_critical_only",
    ):
        if key in values and values[key] is not None:
            CONFIG[key] = values[key]
    return CONFIG


def recommend_thresholds(history: list[dict[str, Any]]) -> dict[str, float]:
    if not history:
        return {
            "recommended_temp_threshold": float(CONFIG["temperature_threshold"]),
            "recommended_vibration_threshold": float(CONFIG["vibration_threshold"]),
            "confidence": 0.5,
        }

    temperatures = [float(item["temperature"]) for item in history if "temperature" in item]
    vibrations = [float(item["vibration"]) for item in history if "vibration" in item]
    temp_avg = mean(temperatures) if temperatures else float(CONFIG["temperature_threshold"]) - 12
    vib_avg = mean(vibrations) if vibrations else float(CONFIG["vibration_threshold"]) - 1
    confidence = min(0.95, 0.55 + len(history) * 0.04)
    return {
        "recommended_temp_threshold": round(max(temp_avg + 12, 65), 1),
        "recommended_vibration_threshold": round(max(vib_avg + 1.1, 1.5), 2),
        "confidence": round(confidence, 2),
    }
