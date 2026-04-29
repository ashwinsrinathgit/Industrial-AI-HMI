from __future__ import annotations

import asyncio
import time
from contextlib import suppress
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from .ai_engine import AdaptiveRiskModel
from .decision_engine import DecisionEngine
from .routes import adaptive, alerts, analyze, auth, dashboard, data, simulate, websocket
from .simulation import DataSimulator


class AlertManagementRuntime:
    def __init__(self) -> None:
        self.simulator = DataSimulator()
        self.ai_model = AdaptiveRiskModel()
        self.decision_engine = DecisionEngine()
        self.latest_data = self.simulator.next_reading()
        self.latest_ai_assessment = self.ai_model.assess(self.latest_data)
        self.latest_alerts = self.decision_engine.process(
            self.latest_data,
            self.latest_ai_assessment,
        )
        self.manual_hold_until = 0.0
        self._lock = asyncio.Lock()

    async def advance(self) -> dict[str, Any]:
        async with self._lock:
            if time.time() < self.manual_hold_until:
                return self.snapshot()

            self.latest_data = self.simulator.next_reading()
            self.latest_ai_assessment = self.ai_model.assess(self.latest_data)
            self.latest_alerts = self.decision_engine.process(
                self.latest_data,
                self.latest_ai_assessment,
            )
            return self.snapshot()

    def snapshot(self) -> dict[str, Any]:
        return {
            "data": self.latest_data,
            "ai_assessment": self.latest_ai_assessment,
            "alerts": self.latest_alerts,
        }


async def telemetry_loop(app: FastAPI) -> None:
    while True:
        await app.state.runtime.advance()
        await asyncio.sleep(1)


def create_app() -> FastAPI:
    app = FastAPI(
        title="AI-Powered Adaptive HMI Alert Management Backend",
        version="1.0.0",
        description="Backend-only FastAPI service for simulated telemetry, AI risk scoring, alert decisions, and real-time streams.",
    )

    app.add_middleware(
        CORSMiddleware,
        allow_origins=["*"],
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    app.include_router(data.router)
    app.include_router(auth.router)
    app.include_router(alerts.router)
    app.include_router(simulate.router)
    app.include_router(analyze.router)
    app.include_router(adaptive.router)
    app.include_router(dashboard.router)
    app.include_router(websocket.router)

    @app.on_event("startup")
    async def startup() -> None:
        app.state.runtime = AlertManagementRuntime()
        app.state.telemetry_task = asyncio.create_task(telemetry_loop(app))

    @app.on_event("shutdown")
    async def shutdown() -> None:
        task = app.state.telemetry_task
        task.cancel()
        with suppress(asyncio.CancelledError):
            await task

    @app.get("/health", tags=["system"])
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    return app


app = create_app()
