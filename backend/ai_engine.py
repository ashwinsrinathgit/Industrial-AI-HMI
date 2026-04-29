from __future__ import annotations

from collections import defaultdict, deque
from typing import Any, Literal, TypedDict

from .simulation import MachineReading
from .templates import get_thresholds, get_machine_metadata

RiskLevel = Literal["low", "medium", "high", "critical"]
Priority = Literal["LOW", "MEDIUM", "HIGH"]
Trend = Literal["increasing", "stable", "decreasing"]


class AiAssessment(TypedDict):
    anomaly_detected: bool
    high_temperature: bool
    abnormal_vibration: bool
    priority: Priority
    priority_score: int
    risk_level: RiskLevel
    confidence: float
    prediction_score: float
    trend: Trend
    predicted_critical: bool
    signal_trends: dict[str, Any]
    explanation: str
    reasons: list[str]
    thresholds: dict[str, float]
    metadata: dict[str, Any]


class AdaptiveRiskModel:
    """Adaptive scoring model with threshold, trend, and simple predictive signals."""

    def __init__(self, window_size: int = 8) -> None:
        self.window_size = window_size
        self._history: dict[str, deque[MachineReading]] = defaultdict(lambda: deque(maxlen=window_size))

    def assess(self, reading: MachineReading) -> AiAssessment:
        temperature = reading["temperature"]
        vibration = reading["vibration"]
        thresholds = get_thresholds(reading["machine_id"])
        metadata = get_machine_metadata(reading["machine_id"])
        history = self._history[reading["machine_id"]]
        history.append(reading)

        high_temperature = temperature > thresholds["temperature_threshold"]
        abnormal_vibration = vibration > thresholds["vibration_threshold"]
        temperature_pressure = self._scale(temperature, low=thresholds["temperature_warning"], high=100)
        vibration_pressure = self._scale(vibration, low=1.0, high=5.0)
        trend_metrics = self._trend_metrics(list(history))
        prediction_score = self._prediction_score(
            temperature_pressure,
            vibration_pressure,
            trend_metrics["temperature_slope"],
            trend_metrics["vibration_slope"],
            trend_metrics["continuous_increase"],
        )
        predicted_critical = (
            prediction_score >= 0.72
            and trend_metrics["trend"] == "increasing"
            and not (high_temperature or abnormal_vibration)
        )

        score = round((temperature_pressure * 58) + (vibration_pressure * 42))
        if high_temperature:
            score += 12
        if abnormal_vibration:
            score += 15
        if predicted_critical:
            score = max(score, 72)
        elif prediction_score >= 0.58:
            score += 8
        if metadata["criticality"] == "critical":
            score += 8
        elif metadata["criticality"] == "high":
            score += 4
        priority_score = min(max(score, 1), 100)

        risk_level = self._risk_level(priority_score)
        anomaly_detected = high_temperature or abnormal_vibration or predicted_critical or priority_score >= 70

        reasons = explain_alert(reading, thresholds, high_temperature, abnormal_vibration, metadata)
        if trend_metrics["trend"] == "increasing":
            reasons.append(
                "temperature and vibration are rising across the rolling telemetry window"
            )
        if predicted_critical:
            reasons.append("predictive model expects a critical condition before threshold breach")
        return {
            "anomaly_detected": anomaly_detected,
            "high_temperature": high_temperature,
            "abnormal_vibration": abnormal_vibration,
            "priority": self._priority(priority_score),
            "priority_score": priority_score,
            "risk_level": risk_level,
            "confidence": self._confidence(priority_score, high_temperature, abnormal_vibration),
            "prediction_score": prediction_score,
            "trend": trend_metrics["trend"],
            "predicted_critical": predicted_critical,
            "signal_trends": trend_metrics,
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
    def _trend_metrics(history: list[MachineReading]) -> dict[str, Any]:
        if len(history) < 3:
            return {
                "trend": "stable",
                "temperature_slope": 0.0,
                "vibration_slope": 0.0,
                "temperature_trend": "stable",
                "vibration_trend": "stable",
                "continuous_increase": False,
                "window_size": len(history),
            }

        span = max(len(history) - 1, 1)
        temperature_slope = round((history[-1]["temperature"] - history[0]["temperature"]) / span, 3)
        vibration_slope = round((history[-1]["vibration"] - history[0]["vibration"]) / span, 3)
        temperature_trend = AdaptiveRiskModel._signal_trend(temperature_slope, 0.25)
        vibration_trend = AdaptiveRiskModel._signal_trend(vibration_slope, 0.035)
        continuous_increase = all(
            history[index]["temperature"] >= history[index - 1]["temperature"]
            and history[index]["vibration"] >= history[index - 1]["vibration"]
            for index in range(1, len(history))
        )

        if temperature_trend == "increasing" and vibration_trend == "increasing":
            trend: Trend = "increasing"
        elif temperature_trend == "decreasing" and vibration_trend == "decreasing":
            trend = "decreasing"
        else:
            trend = "stable"

        return {
            "trend": trend,
            "temperature_slope": temperature_slope,
            "vibration_slope": vibration_slope,
            "temperature_trend": temperature_trend,
            "vibration_trend": vibration_trend,
            "continuous_increase": continuous_increase,
            "window_size": len(history),
        }

    @staticmethod
    def _signal_trend(slope: float, tolerance: float) -> Trend:
        if slope > tolerance:
            return "increasing"
        if slope < -tolerance:
            return "decreasing"
        return "stable"

    @staticmethod
    def _prediction_score(
        temperature_pressure: float,
        vibration_pressure: float,
        temperature_slope: float,
        vibration_slope: float,
        continuous_increase: bool,
    ) -> float:
        temperature_trend_pressure = AdaptiveRiskModel._scale(temperature_slope, low=0.0, high=2.5)
        vibration_trend_pressure = AdaptiveRiskModel._scale(vibration_slope, low=0.0, high=0.35)
        score = (
            temperature_trend_pressure * 0.34
            + vibration_trend_pressure * 0.34
            + temperature_pressure * 0.14
            + vibration_pressure * 0.14
            + (0.04 if continuous_increase else 0.0)
        )
        return round(min(max(score, 0.0), 1.0), 2)

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
