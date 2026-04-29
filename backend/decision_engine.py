from __future__ import annotations

from collections import defaultdict, deque
from datetime import UTC, datetime
from typing import Any, Literal, TypedDict
from uuid import uuid4

from .ai_engine import AiAssessment
from .simulation import MachineReading


Severity = Literal["info", "warning", "critical"]


class Alert(TypedDict):
    id: str
    machine_id: str
    severity: Severity
    priority: str
    priority_score: int
    title: str
    message: str
    timestamp: str
    status: str
    acknowledged: bool
    resolved: bool
    diagnostic_hint: str
    reasons: list[str]
    root_causes: list[str]
    estimated_failure_minutes: int | None
    downtime_cost_per_hour: int
    safety_actions: list[str]
    maintenance_ticket: dict[str, Any]
    correlation_key: str
    metadata: dict[str, Any]


class AuditEvent(TypedDict):
    id: str
    alert_id: str
    action: str
    actor: str
    timestamp: str
    note: str


class DecisionEngine:
    """Turns telemetry and AI assessments into UI-ready alert payloads."""

    def __init__(self, history_limit: int = 100) -> None:
        self._history: deque[Alert] = deque(maxlen=history_limit)
        self._audit_log: deque[AuditEvent] = deque(maxlen=200)
        self._latest_bundle: dict[str, Any] = {
            "active_alerts": [],
            "filtered_alerts": [],
            "grouped_alerts": {},
            "mission_alerts": [],
            "all_alerts": [],
            "grouped_messages": [],
            "audit_log": [],
        }

    @property
    def latest_bundle(self) -> dict[str, Any]:
        return self._latest_bundle

    def process(self, reading: MachineReading, assessment: AiAssessment) -> dict[str, Any]:
        alert = self._create_alert(reading, assessment)
        if alert is not None:
            duplicate = self._find_open_duplicate(alert)
            if duplicate is None:
                self._history.appendleft(alert)
            else:
                self._refresh_duplicate(duplicate, alert)
        elif reading["status"] == "normal" and assessment["priority_score"] < 45:
            self._auto_resolve_machine_alerts(reading["machine_id"])

        self._latest_bundle = self._build_bundle()
        return self._latest_bundle

    def _build_bundle(self) -> dict[str, Any]:
        active_alerts = [item for item in self._history if not item["resolved"]]
        filtered_alerts = [item for item in active_alerts if item["severity"] in {"warning", "critical"}]
        grouped_alerts = self._group_alerts(filtered_alerts)
        grouped_messages = self._group_messages(grouped_alerts)
        mission_alerts = [
            item
            for item in filtered_alerts
            if item["severity"] == "critical" and item["priority_score"] >= 88
        ]

        return {
            "active_alerts": active_alerts[:25],
            "filtered_alerts": filtered_alerts[:25],
            "grouped_alerts": grouped_alerts,
            "grouped_messages": grouped_messages,
            "mission_alerts": mission_alerts[:10],
            "all_alerts": list(self._history)[:50],
            "audit_log": list(self._audit_log)[:25],
        }

    def _auto_resolve_machine_alerts(self, machine_id: str) -> None:
        resolved_ids: list[str] = []
        for alert in self._history:
            if alert["machine_id"] == machine_id and not alert["resolved"]:
                alert["acknowledged"] = True
                alert["resolved"] = True
                resolved_ids.append(alert["id"])

        for alert_id in resolved_ids:
            self._audit_log.appendleft(
                {
                    "id": str(uuid4()),
                    "alert_id": alert_id,
                    "action": "auto_resolve",
                    "actor": "SYSTEM",
                    "timestamp": datetime.now(UTC).isoformat(),
                    "note": f"SYSTEM auto-resolved alert after {machine_id} returned to normal signals",
                }
            )

    def _find_open_duplicate(self, alert: Alert) -> Alert | None:
        for existing in self._history:
            if (
                not existing["resolved"]
                and existing["machine_id"] == alert["machine_id"]
                and existing["severity"] == alert["severity"]
                and existing["correlation_key"] == alert["correlation_key"]
            ):
                return existing
        return None

    @staticmethod
    def _refresh_duplicate(existing: Alert, latest: Alert) -> None:
        acknowledged = existing["acknowledged"]
        resolved = existing["resolved"]
        alert_id = existing["id"]
        existing.update(latest)
        existing["id"] = alert_id
        existing["acknowledged"] = acknowledged
        existing["resolved"] = resolved

    def acknowledge(self, alert_id: str, actor: str = "APEXVIHAG") -> Alert | None:
        return self._update_alert(alert_id, "acknowledge", actor)

    def resolve(self, alert_id: str, actor: str = "APEXVIHAG") -> Alert | None:
        return self._update_alert(alert_id, "resolve", actor)

    def summary(self) -> dict[str, int]:
        alerts = list(self._history)
        active_alerts = [alert for alert in alerts if not alert["resolved"]]
        return {
            "total_alerts": len(active_alerts),
            "critical_count": sum(1 for alert in active_alerts if alert["severity"] == "critical"),
            "warning_count": sum(1 for alert in active_alerts if alert["severity"] == "warning"),
            "acknowledged_count": sum(1 for alert in alerts if alert["acknowledged"]),
            "resolved_count": sum(1 for alert in alerts if alert["resolved"]),
        }

    def diagnostics(self) -> list[dict[str, Any]]:
        return [
            {
                "machine_id": alert["machine_id"],
                "priority_score": alert["priority_score"],
                "severity": alert["severity"],
                "insight": alert["diagnostic_hint"],
                "timestamp": alert["timestamp"],
            }
            for alert in [item for item in self._history if not item["resolved"]][:10]
        ]

    def _create_alert(self, reading: MachineReading, assessment: AiAssessment) -> Alert | None:
        priority = assessment["priority_score"]
        if priority < 45 and reading["status"] == "normal":
            return None

        severity: Severity = "warning"
        if reading["status"] == "critical" or priority >= 88:
            severity = "critical"
        elif priority < 45:
            severity = "info"

        problem_parts: list[str] = []
        if assessment["high_temperature"]:
            problem_parts.append("overheating")
        if assessment["abnormal_vibration"]:
            problem_parts.append("abnormal vibration")
        if not problem_parts:
            problem_parts.append("operating envelope watch condition")

        if assessment["high_temperature"] and assessment["abnormal_vibration"]:
            problem_parts = ["combined fault: overheating and abnormal vibration"]

        title = f"{severity.title()}: {reading['machine_id']}"
        message = f"{severity.title()}: {reading['machine_id']} " + " with ".join(problem_parts)

        return {
            "id": str(uuid4()),
            "machine_id": reading["machine_id"],
            "severity": severity,
            "priority": assessment["priority"],
            "priority_score": priority,
            "title": title,
            "message": message,
            "timestamp": reading["timestamp"],
            "status": reading["status"],
            "acknowledged": False,
            "resolved": False,
            "diagnostic_hint": self._diagnostic_hint(reading, assessment),
            "reasons": assessment["reasons"],
            "root_causes": self._root_causes(assessment),
            "estimated_failure_minutes": self._estimated_failure_minutes(assessment),
            "downtime_cost_per_hour": self._downtime_cost_per_hour(assessment),
            "safety_actions": self._safety_actions(assessment),
            "maintenance_ticket": self._maintenance_ticket(reading, assessment),
            "correlation_key": self._correlation_key(assessment),
            "metadata": {
                **assessment["metadata"],
                "temperature": reading["temperature"],
                "vibration": reading["vibration"],
            },
        }

    def _update_alert(self, alert_id: str, action: str, actor: str) -> Alert | None:
        for alert in self._history:
            if alert["id"] != alert_id:
                continue

            if action == "acknowledge":
                alert["acknowledged"] = True
            if action == "resolve":
                alert["acknowledged"] = True
                alert["resolved"] = True

            self._audit_log.appendleft(
                {
                    "id": str(uuid4()),
                    "alert_id": alert_id,
                    "action": action,
                    "actor": actor,
                    "timestamp": datetime.now(UTC).isoformat(),
                    "note": f"{actor} performed {action} on {alert['machine_id']}",
                }
            )
            self._latest_bundle = self._build_bundle()
            return alert
        return None

    @staticmethod
    def _group_alerts(alerts: list[Alert]) -> dict[str, dict[str, list[Alert]]]:
        grouped: dict[str, dict[str, list[Alert]]] = defaultdict(lambda: defaultdict(list))
        for alert in alerts:
            key = f"{alert['severity']}:{alert['correlation_key']}"
            grouped[alert["machine_id"]][key].append(alert)
        return {machine: dict(by_severity) for machine, by_severity in grouped.items()}

    @staticmethod
    def _group_messages(grouped_alerts: dict[str, dict[str, list[Alert]]]) -> list[dict[str, Any]]:
        messages: list[dict[str, Any]] = []
        for machine_id, severities in grouped_alerts.items():
            count = sum(len(alerts) for alerts in severities.values())
            highest = "critical" if any(key.startswith("critical") for key in severities) else "warning"
            combined = any("combined_fault" in key for key in severities)
            messages.append(
                {
                    "machine_id": machine_id,
                    "severity": highest,
                    "count": count,
                    "message": (
                        f"Combined fault: overheating + vibration grouped for {machine_id}"
                        if combined
                        else f"{count} related {highest} alert(s) grouped for {machine_id}"
                    ),
                }
            )
        return messages

    @staticmethod
    def _correlation_key(assessment: AiAssessment) -> str:
        if assessment["high_temperature"] and assessment["abnormal_vibration"]:
            return "combined_fault"
        if assessment["high_temperature"]:
            return "thermal"
        if assessment["abnormal_vibration"]:
            return "vibration"
        return "degradation"

    @staticmethod
    def _diagnostic_hint(reading: MachineReading, assessment: AiAssessment) -> str:
        if assessment["high_temperature"] and assessment["abnormal_vibration"]:
            return "Run controlled response: verify thermal channel, vibration signature, mechanical alignment, and load profile."
        if assessment["high_temperature"]:
            return "Verify thermal channel, sensor validity, enclosure conditions, and operating load."
        if assessment["abnormal_vibration"]:
            return "Verify vibration signature, mounting integrity, alignment state, and rotating assembly balance."
        return "Signals are inside the operating envelope; continue standard monitoring."

    @staticmethod
    def _root_causes(assessment: AiAssessment) -> list[str]:
        if assessment["high_temperature"] and assessment["abnormal_vibration"]:
            return ["thermal deviation", "vibration deviation", "alignment drift", "load imbalance"]
        if assessment["high_temperature"]:
            return ["thermal deviation", "sensor drift", "sustained load", "ambient condition"]
        if assessment["abnormal_vibration"]:
            return ["vibration deviation", "mounting integrity", "rotating imbalance", "alignment drift"]
        return ["normal operating envelope", "sensor baseline stable", "load variation within range"]

    @staticmethod
    def _estimated_failure_minutes(assessment: AiAssessment) -> int | None:
        score = assessment["priority_score"]
        if score >= 90:
            return 15
        if score >= 80:
            return 30
        if score >= 70:
            return 60
        if score >= 45:
            return 180
        return None

    @staticmethod
    def _downtime_cost_per_hour(assessment: AiAssessment) -> int:
        criticality = assessment["metadata"].get("criticality", "medium")
        base_cost = {"critical": 45000, "high": 30000, "medium": 18000, "low": 9000}.get(criticality, 18000)
        return round(base_cost * (0.7 + assessment["priority_score"] / 100))

    @staticmethod
    def _safety_actions(assessment: AiAssessment) -> list[str]:
        if assessment["risk_level"] in {"critical", "high"}:
            return [
                "notify supervisor",
                "acknowledge alert",
                "prepare controlled shutdown",
                "dispatch maintenance team",
            ]
        if assessment["risk_level"] == "medium":
            return ["increase inspection frequency", "monitor next trend update", "prepare maintenance note"]
        return ["continue normal monitoring"]

    @staticmethod
    def _maintenance_ticket(reading: MachineReading, assessment: AiAssessment) -> dict[str, Any]:
        priority = "P1" if assessment["priority_score"] >= 88 else "P2" if assessment["priority_score"] >= 70 else "P3"
        return {
            "ticket_id": f"MT-{reading['machine_id'].replace('_', '')}-{datetime.now(UTC).strftime('%H%M%S')}",
            "priority": priority,
            "assigned_team": "Mechanical Maintenance" if assessment["abnormal_vibration"] else "Thermal Systems",
            "status": "ready_to_create",
            "recommended_action": DecisionEngine._diagnostic_hint(reading, assessment),
        }
