from __future__ import annotations

import math
import random
from datetime import UTC, datetime
from typing import Any, Literal, TypedDict

from .templates import get_thresholds


Status = Literal["normal", "warning", "critical"]
Pattern = Literal["normal", "manual_input", "gradual_increase", "sudden_spike"]


class MachineReading(TypedDict):
    machine_id: str
    temperature: float
    vibration: float
    timestamp: str
    status: Status
    pattern: Pattern


class DataSimulator:
    """Produces realistic machine telemetry with normal, rising, and fault phases."""

    def __init__(self, machine_id: str = "Machine_A") -> None:
        self.machine_id = machine_id
        self._tick = 0
        self._last_reading: MachineReading | None = None

    @property
    def latest(self) -> MachineReading:
        if self._last_reading is None:
            return self.next_reading()
        return self._last_reading

    def next_reading(self) -> MachineReading:
        self._tick += 1
        pattern = self._current_pattern()

        if pattern == "normal":
            temperature = 62 + math.sin(self._tick / 5) * 3 + random.uniform(-1.8, 1.8)
            vibration = 1.0 + math.sin(self._tick / 7) * 0.25 + random.uniform(-0.12, 0.12)
        elif pattern == "gradual_increase":
            phase_tick = self._tick % 45
            temperature = 68 + phase_tick * 0.65 + random.uniform(-1.2, 1.2)
            vibration = 1.45 + phase_tick * 0.045 + random.uniform(-0.1, 0.18)
        else:
            temperature = random.uniform(88, 100)
            vibration = random.uniform(3.4, 5.0)

        temperature = round(min(max(temperature, 40), 100), 1)
        vibration = round(min(max(vibration, 0.1), 5.0), 2)

        reading: MachineReading = {
            "machine_id": self.machine_id,
            "temperature": temperature,
            "vibration": vibration,
            "timestamp": datetime.now(UTC).isoformat(),
            "status": self._status_for(temperature, vibration, self.machine_id),
            "pattern": pattern,
        }
        self._last_reading = reading
        return reading

    def _current_pattern(self) -> Pattern:
        cycle_position = self._tick % 90
        if 0 <= cycle_position < 38:
            return "normal"
        if 38 <= cycle_position < 78:
            return "gradual_increase"
        return "sudden_spike"

    @staticmethod
    def _status_for(temperature: float, vibration: float, machine_id: str = "Machine_A") -> Status:
        thresholds = get_thresholds(machine_id)
        if temperature > thresholds["temperature_threshold"] or vibration > thresholds["vibration_threshold"]:
            return "critical"
        if temperature > thresholds["temperature_warning"] or vibration > thresholds["vibration_warning"]:
            return "warning"
        return "normal"


def as_json_safe(reading: MachineReading) -> dict[str, Any]:
    return dict(reading)
