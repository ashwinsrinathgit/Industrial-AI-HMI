from __future__ import annotations

from .templates import SIGNAL_TEMPLATES


def generate_hmi(machine_type: str) -> dict:
    template = SIGNAL_TEMPLATES.get(machine_type, SIGNAL_TEMPLATES["motor_standard"])
    widgets = [
        {
            "id": widget,
            "title": widget.replace("_", " ").title(),
            "type": _widget_type(widget),
            "source": "live",
        }
        for widget in template["widgets"]
    ]
    return {
        "machine_type": machine_type,
        "widgets": widgets,
        "layout": template.get("layout", "grid"),
        "alerts": [
            {
                "condition": "temperature",
                "threshold": template["temperature_threshold"],
                "message": "Temperature threshold breach",
            },
            {
                "condition": "vibration",
                "threshold": template["vibration_threshold"],
                "message": "Vibration threshold breach",
            },
        ],
    }


def _widget_type(widget: str) -> str:
    if widget in {"temperature", "vibration", "confidence", "priority"}:
        return "metric"
    if widget == "alerts":
        return "alert_list"
    return "insight"
