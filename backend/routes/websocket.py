from __future__ import annotations

import asyncio

from fastapi import APIRouter, WebSocket, WebSocketDisconnect


router = APIRouter(tags=["websocket"])


@router.websocket("/ws/live")
async def live_stream(websocket: WebSocket) -> None:
    await websocket.accept()
    try:
        while True:
            snapshot = await websocket.app.state.runtime.advance()
            await websocket.send_json(snapshot)
            await asyncio.sleep(1)
    except WebSocketDisconnect:
        return
