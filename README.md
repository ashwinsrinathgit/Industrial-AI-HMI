# AI-Powered Adaptive HMI for Intelligent Alert Management

A full-stack, software-only prototype for intelligent industrial alert management. The system simulates machine telemetry, applies AI-style rule-based anomaly detection, prioritizes alerts, groups related incidents, and displays everything in a modern adaptive HMI dashboard.

The project is designed for hackathon/demo presentation and includes industry-style features such as role-based views, live WebSocket updates, manual machine analysis, alert acknowledgment/resolution, audit trail, escalation queue, SLA status, and incident report export.

## Tech Stack

- Backend: Python, FastAPI
- Frontend: React, Vite, TypeScript
- AI Logic: Python rule-based anomaly detection and priority scoring
- Communication: REST API and WebSockets
- UI Style: Dark professional industrial dashboard

## Key Features

### Backend Features

- FastAPI backend with modular architecture
- Mock industrial data simulation
- Temperature and vibration telemetry
- AI anomaly detection
- Priority scoring: `LOW`, `MEDIUM`, `HIGH`
- Alert severity: `normal`, `warning`, `critical`
- Alert filtering and grouping
- Mission-critical alert generation
- Role-based dashboard responses
- WebSocket live data streaming
- Alert acknowledgment and resolution APIs
- Audit logging for operator actions
- CORS enabled for frontend integration

### Frontend Features

- React/Vite dashboard connected to FastAPI backend
- Live alert cards with color coding
  - Red: Critical
  - Yellow: Warning
  - Green: Normal
- Real-time refresh through WebSockets
- Sidebar navigation:
  - Dashboard
  - Alerts
  - Analytics
  - Machines
  - Settings
- Alert Analysis Control panel
- Scenario buttons:
  - Normal Run
  - Heat Warning
  - Critical Fault
- Temperature and vibration sliders
- Role-Based HMI panel
- Industry Readiness / Governance Center
- SLA state and escalation queue
- Audit trail
- Incident report JSON export
- Username displayed as `APEXVIHAG`

## Project Structure

```text
huma-vision-core-main/
  README.md
  package.json
  vite.config.ts
  tsconfig.json

  backend/
    __init__.py
    main.py
    simulation.py
    ai_engine.py
    decision_engine.py
    run_server.py
    requirements.txt
    routes/
      __init__.py
      alerts.py
      analyze.py
      dashboard.py
      data.py
      simulate.py
      websocket.py

  src/
    hooks/
      use-backend-telemetry.ts
      use-mobile.tsx
    lib/
      backend.ts
      utils.ts
    routes/
      __root.tsx
      index.tsx
      alerts.tsx
      analytics.tsx
      machines.tsx
      settings.tsx
    components/
      dashboard/
        AlertAnalysisSettings.tsx
        AlertCard.tsx
        AppSidebar.tsx
        Charts.tsx
        DashboardShell.tsx
        IndustryReadinessPanel.tsx
        KpiCard.tsx
        LiveAlertFeed.tsx
        MachineStatusGrid.tsx
        MaintenanceInsights.tsx
        RoleInformationPanel.tsx
        SectionHeader.tsx
        TopAlertsTable.tsx
        TopNav.tsx
      ui/
        reusable UI components
```

## How The Project Works

The backend continuously generates simulated industrial machine data. The AI engine analyzes the generated readings and assigns risk levels based on temperature and vibration. The decision engine converts AI results into structured alerts. The frontend receives this data through REST APIs and WebSockets and displays it in a role-aware dashboard.

```text
simulation.py
  -> ai_engine.py
  -> decision_engine.py
  -> FastAPI REST + WebSocket
  -> React HMI Dashboard
```

Example machine reading:

```json
{
  "machine_id": "Machine_A",
  "temperature": 91.5,
  "vibration": 3.7,
  "timestamp": "2026-04-29T14:00:00Z",
  "status": "critical",
  "pattern": "manual_input"
}
```

Example AI result:

```json
{
  "anomaly_detected": true,
  "high_temperature": true,
  "abnormal_vibration": true,
  "priority": "HIGH",
  "priority_score": 100,
  "risk_level": "critical",
  "confidence": 0.98
}
```

Example generated alert:

```text
Critical: Machine_A overheating with abnormal vibration
```

## Backend API Endpoints

Backend runs at:

```text
http://127.0.0.1:8000
```

### System

```http
GET /health
```

Returns backend health status.

### Simulated Data

```http
GET /simulate
```

Generates one raw simulated telemetry event.

```http
GET /data
```

Returns the latest simulated machine reading.

### AI Analysis

```http
POST /analyze
```

Runs AI analysis on custom machine input.

Request body:

```json
{
  "machine_id": "Machine_A",
  "temperature": 91.5,
  "vibration": 3.7
}
```

### Alerts

```http
GET /alerts
```

Returns:

- AI assessment
- filtered alerts
- grouped alerts
- grouped messages
- mission alerts
- all alerts
- audit log

### Alert Workflow

```http
POST /alerts/{alert_id}/acknowledge
```

Acknowledges an alert.

```http
POST /alerts/{alert_id}/resolve
```

Resolves an alert.

Request body:

```json
{
  "actor": "APEXVIHAG"
}
```

### Role-Based Dashboard

```http
GET /dashboard?role=operator
GET /dashboard?role=manager
GET /dashboard?role=maintenance
GET /dashboard?role=producer
GET /dashboard?role=worker
GET /dashboard?role=supervisor
```

Each role receives different information:

- Operator: live machine data and live alerts
- Manager: summary, total alerts, critical count, mission alerts
- Maintenance: diagnostics and AI repair hints
- Producer: production output, efficiency, quality risk
- Worker: safe-to-operate status and next action instructions
- Supervisor: team overview, escalation queue, grouped alerts

### WebSocket

```text
ws://127.0.0.1:8000/ws/live
```

Streams live data:

- machine telemetry
- AI assessment
- processed alerts

## Frontend Pages

Frontend runs at:

```text
http://127.0.0.1:5173
```

### Dashboard

```text
/
```

Main HMI dashboard with KPIs, alert analysis controls, role-based HMI, governance panel, live alerts, machine status, analytics charts, maintenance insights, and live API payload.

### Alerts

```text
/alerts
```

Shows critical alerts, warning/normal alerts, and the active alert table with ACK/Resolve actions.

### Analytics

```text
/analytics
```

Shows alert metrics, severity distribution, alert trend chart, and AI explanation.

### Machines

```text
/machines
```

Shows machine status, temperature trend, vibration trend, current priority, and simulation pattern.

### Settings

```text
/settings
```

Contains alert analysis controls, role configuration view, backend connection details, and governance panel.

## Industry-Ready Demo Features

### Alert Analysis Control

Use this panel to demonstrate AI behavior manually:

1. Select a scenario: `Normal Run`, `Heat Warning`, or `Critical Fault`
2. Or manually adjust temperature and vibration
3. Click `Run AI Analysis`
4. Dashboard displays priority, score, status, and recommended actions

Manual analysis stays visible briefly before the live stream resumes, making it easier to present during a demo.

### Operations Governance Center

Shows:

- SLA state
- number of acknowledged alerts
- number of resolved alerts
- compliance status
- escalation queue
- audit trail
- export incident report button

### Incident Report Export

The frontend can export a JSON incident report containing:

- generated by: `APEXVIHAG`
- timestamp
- SLA state
- alert summary
- latest alerts
- audit log

## Run Instructions

Open the project folder:

```powershell
cd C:\Users\Ashwin\Downloads\huma-vision-core-main
```

### 1. Start Backend

If virtual environment already exists:

```powershell
backend\venv\Scripts\python.exe backend\run_server.py
```

If virtual environment does not exist:

```powershell
python -m venv backend\venv
backend\venv\Scripts\python.exe -m pip install -r backend\requirements.txt
backend\venv\Scripts\python.exe backend\run_server.py
```

Backend docs:

```text
http://127.0.0.1:8000/docs
```

### 2. Start Frontend

Open a second terminal:

```powershell
cd C:\Users\Ashwin\Downloads\huma-vision-core-main
npm install
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```

Frontend dashboard:

```text
http://127.0.0.1:5173
```

## Environment Variables

The frontend defaults to local backend URLs:

```text
VITE_BACKEND_HTTP_URL=http://127.0.0.1:8000
VITE_BACKEND_WS_URL=ws://127.0.0.1:8000
```

You can override them in a `.env` file if needed.

## Verification Commands

Backend syntax check:

```powershell
backend\venv\Scripts\python.exe -m py_compile backend\*.py backend\routes\*.py
```

Frontend production build:

```powershell
npm.cmd run build
```

API smoke tests:

```powershell
Invoke-RestMethod -Uri http://127.0.0.1:8000/health
Invoke-RestMethod -Uri http://127.0.0.1:8000/simulate
Invoke-RestMethod -Uri http://127.0.0.1:8000/alerts
```

Analyze test:

```powershell
Invoke-RestMethod `
  -Method Post `
  -Uri http://127.0.0.1:8000/analyze `
  -ContentType "application/json" `
  -Body '{"machine_id":"Machine_Demo","temperature":92,"vibration":4.1}'
```

## Demo Script

1. Start backend and frontend.
2. Open `http://127.0.0.1:5173`.
3. Show live KPIs and machine status.
4. Click `Critical Fault` in Alert Analysis Control.
5. Explain that AI detected high temperature and abnormal vibration.
6. Show the generated critical alert.
7. Open Role-Based HMI and switch between Producer, Worker, Supervisor, Operator, Manager, and Maintenance.
8. Show the Operations Governance Center.
9. Click ACK or Resolve in the alert table.
10. Show that audit trail records the operator action.
11. Export the incident report JSON.

## Project Goal

The goal of this project is to demonstrate how an AI-powered adaptive HMI can reduce alert overload, prioritize critical industrial events, provide role-specific information, and support production-grade operational workflows such as escalation, auditability, and incident reporting.

## User

Configured dashboard user:

```text
APEXVIHAG
```
