from __future__ import annotations

from typing import Any, TypedDict

from .ai_engine import AiAssessment
from .simulation import MachineReading


class Recommendation(TypedDict):
    id: str
    machine_id: str
    priority: str
    action: str
    rationale: str
    owner: str


class RecommendationEngine:
    """Rules-based AI action layer fed by current signals, trends, and root cause."""

    def recommend(
        self,
        reading: MachineReading,
        assessment: AiAssessment,
        alerts: dict[str, Any] | None = None,
    ) -> list[Recommendation]:
        root_cause = self._root_cause_from_alerts(alerts) or self._root_cause_from_assessment(assessment)
        actions: list[Recommendation] = []

        if assessment.get("predicted_critical"):
            actions.extend(
                [
                    self._action(reading, "HIGH", "Reduce load to 70% and increase watch frequency.", "Predicted critical trend is rising before the hard limit.", "Operator"),
                    self._action(reading, "HIGH", "Schedule inspection during the next available maintenance window.", root_cause, "Maintenance"),
                ]
            )

        if assessment["high_temperature"] or "Thermal" in root_cause or "Overheating" in root_cause:
            actions.extend(
                [
                    self._action(reading, assessment["priority"], "Check cooling fan, coolant flow, and enclosure airflow.", "Thermal stress is the likely root cause.", "Maintenance"),
                    self._action(reading, assessment["priority"], "Reduce spindle/load demand until temperature stabilizes.", "Lower load reduces heat generation.", "Operator"),
                ]
            )

        if assessment["abnormal_vibration"] or "vibration" in root_cause.lower():
            actions.extend(
                [
                    self._action(reading, assessment["priority"], "Inspect bearings, mounting bolts, alignment, and balance.", "Vibration signature indicates mechanical instability.", "Maintenance"),
                    self._action(reading, "MEDIUM", "Listen for new noise and report any change during the next cycle.", "Human confirmation helps validate vibration drift.", "Worker"),
                ]
            )

        if not actions:
            actions.append(
                self._action(
                    reading,
                    "LOW",
                    "Continue normal monitoring and keep the current process envelope.",
                    "Signals are stable and below active alert thresholds.",
                    "Operator",
                )
            )

        return self._dedupe(actions)

    @staticmethod
    def _root_cause_from_alerts(alerts: dict[str, Any] | None) -> str | None:
        if not alerts:
            return None
        active = alerts.get("filtered_alerts") or alerts.get("active_alerts") or []
        if not active:
            return None
        return active[0].get("root_cause")

    @staticmethod
    def _root_cause_from_assessment(assessment: AiAssessment) -> str:
        if assessment["high_temperature"] and assessment["abnormal_vibration"]:
            return "Overheating causing vibration spike"
        if assessment.get("predicted_critical"):
            return "Rising thermal and vibration trend"
        if assessment["high_temperature"]:
            return "Thermal overload"
        if assessment["abnormal_vibration"]:
            return "Mechanical vibration instability"
        return "Normal operating envelope"

    @staticmethod
    def _action(
        reading: MachineReading,
        priority: str,
        action: str,
        rationale: str,
        owner: str,
    ) -> Recommendation:
        action_id = action.lower().replace(" ", "_").replace(".", "")[:48]
        return {
            "id": f"{reading['machine_id']}:{action_id}",
            "machine_id": reading["machine_id"],
            "priority": priority,
            "action": action,
            "rationale": rationale,
            "owner": owner,
        }

    @staticmethod
    def _dedupe(actions: list[Recommendation]) -> list[Recommendation]:
        seen: set[str] = set()
        unique: list[Recommendation] = []
        for action in actions:
            if action["id"] in seen:
                continue
            seen.add(action["id"])
            unique.append(action)
        return unique[:6]
