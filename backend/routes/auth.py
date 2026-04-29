from __future__ import annotations

from typing import Literal

from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field


DashboardRole = Literal["operator", "manager", "maintenance", "producer", "worker", "supervisor"]

router = APIRouter(tags=["auth"])


class LoginRequest(BaseModel):
    user_id: str = Field(min_length=3, max_length=64)
    password: str = Field(min_length=4, max_length=128)
    role: DashboardRole


@router.post("/login")
async def login(payload: LoginRequest) -> dict:
    """Demo-grade backend login for role-scoped HMI access."""
    if payload.password.strip() != "5555":
        raise HTTPException(status_code=401, detail="Invalid PIN")

    display_name = payload.user_id.strip().upper()
    return {
        "token": f"session-{payload.role}-{display_name}",
        "user": {
            "user_id": payload.user_id.strip(),
            "display_name": display_name,
            "role": payload.role,
        },
    }
