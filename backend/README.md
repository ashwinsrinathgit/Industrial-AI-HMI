# AI-Powered Adaptive HMI Alert Management Backend

Backend-only FastAPI service for simulated machine telemetry, AI risk scoring, alert generation, role-specific dashboard payloads, and real-time WebSocket streaming.

## Run

```bash
python -m pip install -r requirements.txt
python -m uvicorn backend.main:app --reload
```

For a workspace-local dependency install that does not touch global Python packages:

```powershell
python -m venv backend\venv
backend\venv\Scripts\python.exe -m pip install -r backend\requirements.txt
python backend\run_server.py
```

The launcher runs without reload mode so it stays stable on Windows shells that restrict subprocess spawning.

## Endpoints

- `GET /data` returns the latest simulated machine reading.
- `GET /alerts` returns AI assessment plus filtered, grouped, and mission alerts.
- `GET /dashboard?role=operator` returns live alerts and machine data.
- `GET /dashboard?role=manager` returns alert summary and mission alerts.
- `GET /dashboard?role=maintenance` returns diagnostic insights.
- `WebSocket /ws/live` streams live telemetry, AI assessment, and alerts.
