from __future__ import annotations

from typing import Any, Literal, TypedDict

from .simulation import MachineReading
from .templates import get_machine_metadata, get_thresholds


RiskLevel = Literal["low", "medium", "high", "critical"]
Priority = Literal["LOW", "MEDIUM", "HIGH"]


class AiAssessment(TypedDict):
    anomaly_detected: bool
    high_temperature: bool
    abnormal_vibration: bool
    priority: Priority
    priority_score: int
    risk_level: RiskLevel
    confidence: float
    explanation: str
    reasons: list[str]
    thresholds: dict[str, float]
    metadata: dict[str, Any]


class AdaptiveRiskModel:
    """Threshold-driven AI model ready to be replaced by a trained model later."""

    def assess(self, reading: MachineReading) -> AiAssessment:
        temperature = reading["temperature"]
        vibration = reading["vibration"]
        thresholds = get_thresholds(reading["machine_id"])
        metadata = get_machine_metadata(reading["machine_id"])

        high_temperature = temperature > thresholds["temperature_threshold"]
        abnormal_vibration = vibration > thresholds["vibration_threshold"]
        temperature_pressure = self._scale(temperature, low=thresholds["temperature_warning"], high=100)
        vibration_pressure = self._scale(vibration, low=1.0, high=5.0)

        score = round((temperature_pressure * 58) + (vibration_pressure * 42))
        if high_temperature:
            score += 12
        if abnormal_vibration:
            score += 15
        if metadata["criticality"] == "critical":
            score += 8
        elif metadata["criticality"] == "high":
            score += 4
        priority_score = min(max(score, 1), 100)

        risk_level = self._risk_level(priority_score)
        anomaly_detected = high_temperature or abnormal_vibration or priority_score >= 70

        reasons = explain_alert(reading, thresholds, high_temperature, abnormal_vibration, metadata)
        return {
            "anomaly_detected": anomaly_detected,
            "high_temperature": high_temperature,
            "abnormal_vibration": abnormal_vibration,
            "priority": self._priority(priority_score),
            "priority_score": priority_score,
            "risk_level": risk_level,
            "confidence": self._confidence(priority_score, high_temperature, abnormal_vibration),
            "explanation": self._explain(reading, reasons, priority_score),
            "reasons": reasons,
            "thresholds": thresholds,
            "metadata": metadata,
        }

    @staticmethod
    def _scale(value: float, low: float, high: float) -> float:
        return min(max((value - low) / (high - low), 0), 1)

    @staticmethod
    def _risk_level(priority_score: int) -> RiskLevel:
        if priority_score >= 88:
            return "critical"
        if priority_score >= 70:
            return "high"
        if priority_score >= 45:
            return "medium"
        return "low"

    @staticmethod
    def _priority(priority_score: int) -> Priority:
        if priority_score >= 70:
            return "HIGH"
        if priority_score >= 45:
            return "MEDIUM"
        return "LOW"

    @staticmethod
    def _confidence(priority_score: int, high_temperature: bool, abnormal_vibration: bool) -> float:
        rule_matches = int(high_temperature) + int(abnormal_vibration)
        confidence = 0.62 + (priority_score / 100) * 0.22 + rule_matches * 0.08
        return round(min(confidence, 0.98), 2)

    @staticmethod
    def _explain(
        reading: MachineReading,
        reasons: list[str],
        priority_score: int,
    ) -> str:
        if not reasons:
            reasons.append("signals are within acceptable operating thresholds")
        return f"Priority {priority_score}: " + " and ".join(reasons)


def assess_reading(reading: MachineReading) -> dict[str, Any]:
    return dict(AdaptiveRiskModel().assess(reading))


def explain_alert(
    reading: MachineReading,
    thresholds: dict[str, float] | None = None,
    high_temperature: bool | None = None,
    abnormal_vibration: bool | None = None,
    metadata: dict[str, Any] | None = None,
) -> list[str]:
    thresholds = thresholds or get_thresholds(reading["machine_id"])
    metadata = metadata or get_machine_metadata(reading["machine_id"])
    high_temperature = (
        reading["temperature"] > thresholds["temperature_threshold"]
        if high_temperature is None
        else high_temperature
    )
    abnormal_vibration = (
        reading["vibration"] > thresholds["vibration_threshold"]
        if abnormal_vibration is None
        else abnormal_vibration
    )
    reasons: list[str] = []
    if high_temperature:
        reasons.append(
            f"temperature {reading['temperature']}C exceeded configured threshold {thresholds['temperature_threshold']}C"
        )
    if abnormal_vibration:
        reasons.append(
            f"vibration {reading['vibration']} mm/s exceeded configured threshold {thresholds['vibration_threshold']} mm/s"
        )
    if metadata["criticality"] in {"high", "critical"}:
        reasons.append(f"machine criticality is {metadata['criticality']} at {metadata['location']}")
    return reasons
