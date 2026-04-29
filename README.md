# AI-Powered Adaptive HMI for Intelligent Alert Management

A full-stack industrial HMI prototype for intelligent alert management. The app simulates machine telemetry, analyzes temperature and vibration signals, prioritizes alerts, auto-clears stale alerts when signals return to normal, and presents role-specific dashboards for plant operations.

The current version includes a public **System Monitoring Variables** page, shared live state across six user roles, real-time REST/WebSocket updates, Apple/MacBook-style UI motion, active alert workflows, governance reporting, and deployment-ready frontend/backend configuration.

## Tech Stack

- Frontend: React, Vite, TypeScript, TanStack Router
- Backend: Python, FastAPI
- AI Logic: threshold, trend, predictive risk scoring, root-cause grouping, and recommendations
- Realtime: REST API plus WebSocket live stream
- Deployment: Netlify frontend, Railway or Render backend
- UI: black professional industrial dashboard with smooth glass-style animations

## Main Features

### Shared System Monitoring

- Public page: `/system-monitoring`
- Available before login from the login page
- Sets shared machine variables:
  - machine ID
  - temperature
  - vibration
- A single submitted reading updates all six role dashboards:
  - Producer
  - Worker
  - Supervisor
  - Operator
  - Manager
  - Maintenance
- All roles receive the same values, alerts, and timestamp.
- Graphs update from the submitted/shared signal history.

### Alert Intelligence

- Priority levels: `LOW`, `MEDIUM`, `HIGH`
- Risk levels: `low`, `medium`, `high`, `critical`
- Rolling trend detection tracks `increasing`, `stable`, and `decreasing` machine behavior.
- Predictive alerts include `prediction_score`, `predicted_critical`, and signal slope metadata.
- Related thermal and vibration alerts are grouped under a root cause such as `Overheating causing vibration spike`.
- Active alerts are separated from alert history.
- If a machine returns to safe values, open alerts for that machine are auto-resolved.
- Resolved incidents remain available in history/audit data.
- ACK and Resolve workflows are available from alert tables.

### Role-Based HMI

Each logged-in role sees a different operational view:

- Operator: live machine state, temperature, vibration, and active alerts
- Worker: safe-to-operate state and next action
- Producer: production output, efficiency, and blockers
- Supervisor: team overview, escalation queue, grouped alerts
- Manager: alert totals, critical counts, and mission alerts
- Maintenance: diagnostics and repair guidance

### Adaptive AI Features

- `recommendation_engine.py` converts machine state and root cause into operator, worker, and maintenance actions.
- WebSocket snapshots now push `ai_assessment`, active/grouped alerts, alert clusters, and `recommendations`.
- `/auto-hmi` lets a user select machine type and signals, then generates dashboard widgets from the backend.
- Dashboards conditionally surface live metrics, impact, root cause, and recommended fixes based on role and severity.

### UI and Experience

- Black industrial dashboard theme
- MacBook-style smooth animations:
  - springy card hover
  - glass surface shine
  - chart entrance/draw animations
  - floating icons
  - animated table rows
  - soft button press interactions
- Live health snapshot
- Six-role sync matrix
- Operational forecast and next-action recommendation
- Active alert sync panel
- Incident report export

## Project Structure

```text
huma-vision-core-main/
  README.md
  GITHUB_DEPLOYMENT.md
  package.json
  netlify.toml
  render.yaml
  vite.config.ts
  vite.netlify.config.ts

  backend/
    main.py
    run_server.py
    ai_engine.py
    decision_engine.py
    recommendation_engine.py
    simulation.py
    templates.py
    requirements.txt
    Procfile
    railway.json
    routes/
      adaptive.py
      alerts.py
      analyze.py
      auth.py
      dashboard.py
      data.py
      recommendations.py
      simulate.py
      websocket.py

  src/
    routes/
      index.tsx
      login.tsx
      system-monitoring.tsx
      alerts.tsx
      analytics.tsx
      machines.tsx
      settings.tsx
    components/
      dashboard/
      ui/
    hooks/
    lib/
```

## Local Run

Open the project folder:

```powershell
cd C:\Users\Ashwin\Downloads\huma-vision-core-main
```

Start backend:

```powershell
backend\venv\Scripts\python.exe backend\run_server.py
```

If the backend virtual environment does not exist:

```powershell
python -m venv backend\venv
backend\venv\Scripts\python.exe -m pip install -r backend\requirements.txt
backend\venv\Scripts\python.exe backend\run_server.py
```

Start frontend in another terminal:

```powershell
cd C:\Users\Ashwin\Downloads\huma-vision-core-main
npm install
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

Open:

```text
http://127.0.0.1:5173
```

Public system monitoring page:

```text
http://127.0.0.1:5173/system-monitoring
```

Backend docs:

```text
http://127.0.0.1:8000/docs
```

## Backend API

Backend runs locally at:

```text
http://127.0.0.1:8000
```

Important endpoints:

```http
GET /health
GET /simulate
GET /data
GET /alerts
GET /dashboard?role=operator
GET /dashboard?role=manager
GET /dashboard?role=maintenance
GET /dashboard?role=producer
GET /dashboard?role=worker
GET /dashboard?role=supervisor
GET /recommendations?machine_id=Machine_A
POST /analyze
POST /generate-hmi
POST /alerts/{alert_id}/acknowledge
POST /alerts/{alert_id}/resolve
ws://127.0.0.1:8000/ws/live
```

Analyze example:

```json
{
  "machine_id": "Machine_A",
  "temperature": 46,
  "vibration": 0.78
}
```

Safe values such as `temperature: 1` and `vibration: 1` are accepted and should produce `LOW`, `normal`, and `0` active alerts.

Analyze response includes:

```json
{
  "ai_assessment": {
    "priority": "LOW",
    "prediction_score": 0,
    "trend": "stable",
    "predicted_critical": false
  },
  "alerts": {
    "active_alerts": [],
    "grouped_alerts": {},
    "alert_clusters": []
  },
  "recommendations": [
    {
      "priority": "LOW",
      "owner": "Operator",
      "action": "Continue normal monitoring and keep the current process envelope."
    }
  ]
}
```

Auto HMI example:

```json
{
  "machine_type": "CNC",
  "signals": ["temperature", "vibration", "load"]
}
```

## Frontend Pages

- `/login`: role login plus public System Monitoring entry
- `/system-monitoring`: shared temperature/vibration control, graphs, sync matrix, active alerts
- `/`: role-specific dashboard after login
- `/alerts`: active alert center with ACK/Resolve actions
- `/auto-hmi`: adaptive HMI generator for machine type and signal-driven layouts
- `/analytics`: alert trends and severity distribution
- `/machines`: machine state, temperature, vibration, and priority
- `/settings`: runtime config, HMI generation, governance center
- `/signal-adjustment`: redirects to `/system-monitoring`

## Environment Variables

Local defaults:

```text
VITE_BACKEND_HTTP_URL=http://127.0.0.1:8000
VITE_BACKEND_WS_URL=ws://127.0.0.1:8000
```

For Netlify, set:

```text
VITE_BACKEND_HTTP_URL=https://your-backend-url
VITE_BACKEND_WS_URL=wss://your-backend-url
```

## Deployment

Recommended deployment:

- Frontend: Netlify connected to GitHub
- Backend: Railway or Render

Netlify settings:

```text
Build command: npm run build:netlify
Publish directory: netlify-dist
```

Railway backend:

```text
Root directory: backend
Install command: pip install -r requirements.txt
Start command: python run_server.py
Health check path: /health
```

Render backend:

```text
Root directory: backend
Build command: pip install -r requirements.txt
Start command: python run_server.py
Health check path: /health
```

See `GITHUB_DEPLOYMENT.md` for upload and deployment notes.

## Verification

Frontend build:

```powershell
npm.cmd run build
```

Backend syntax check:

```powershell
$env:PYTHONPYCACHEPREFIX="$PWD\.pycache-check"
$files = Get-ChildItem backend -Filter *.py
$routeFiles = Get-ChildItem backend\routes -Filter *.py
backend\venv\Scripts\python.exe -m py_compile @($files + $routeFiles | ForEach-Object { $_.FullName })
Remove-Item -Recurse -Force .pycache-check -ErrorAction SilentlyContinue
```

API smoke test:

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8000/health
Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:8000/analyze `
  -ContentType "application/json" `
  -Body '{"machine_id":"Machine_A","temperature":1,"vibration":1}'
```

Expected safe-state result:

```text
priority: LOW
status: normal
active_alerts: 0
```

## Demo Script

1. Start backend and frontend.
2. Open `/system-monitoring`.
3. Set temperature and vibration values.
4. Run AI Analysis.
5. Show that the same values appear in the six-role sync matrix.
6. Log in as each role and show matching machine values/timestamp.
7. Run `Critical Fault` and show active alerts.
8. Run safe values such as `1 C` and `1 mm/s`.
9. Show active alerts clear while old incidents remain in history.
10. Open governance/export features for audit evidence.

## Default User

Configured dashboard user:

```text
APEXVIHAG
```
