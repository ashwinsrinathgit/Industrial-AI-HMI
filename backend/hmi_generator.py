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


def generate_custom_hmi(machine_type: str, signals: list[str]) -> dict:
    normalized_signals = [signal.strip().lower() for signal in signals if signal.strip()]
    if not normalized_signals:
        normalized_signals = ["temperature", "vibration"]

    widgets = [_widget_for_signal(signal) for signal in normalized_signals]
    widgets.append(
        {
            "id": "ai_recommendations",
            "title": "AI Recommendations",
            "type": "recommendation_panel",
            "source": "recommendations",
        }
    )
    widgets.append(
        {
            "id": "active_alerts",
            "title": "Active Alerts",
            "type": "alert_cluster",
            "source": "alerts.filtered_alerts",
        }
    )

    return {
        "machine_type": machine_type,
        "layout": [
            {"section": "live_metrics", "widgets": [widget["id"] for widget in widgets if widget["type"] == "metric"]},
            {"section": "intelligence", "widgets": ["ai_recommendations", "active_alerts"]},
            {"section": "trends", "widgets": [widget["id"] for widget in widgets if widget["type"] == "trend_chart"]},
        ],
        "widgets": widgets,
        "alerts": [
            {
                "condition": signal,
                "threshold": _default_threshold(signal),
                "message": f"{signal.replace('_', ' ').title()} adaptive threshold breach",
            }
            for signal in normalized_signals
        ],
    }


def _widget_for_signal(signal: str) -> dict:
    if signal in {"temperature", "vibration"}:
        return {
            "id": f"{signal}_trend",
            "title": f"{signal.title()} Trend",
            "type": "trend_chart",
            "source": f"data.{signal}",
        }
    return {
        "id": f"{signal}_metric",
        "title": signal.replace("_", " ").title(),
        "type": "metric",
        "source": f"data.{signal}",
    }


def _default_threshold(signal: str) -> float:
    thresholds = {
        "temperature": 80,
        "vibration": 3.0,
        "pressure": 6.5,
        "load": 85,
        "speed": 3200,
    }
    return thresholds.get(signal, 1)


def _widget_type(widget: str) -> str:
    if widget in {"temperature", "vibration", "confidence", "priority"}:
        return "metric"
    if widget == "alerts":
        return "alert_list"
    return "insight"
