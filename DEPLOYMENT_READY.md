# Deployment Ready Checklist

This project is prepared for:

- GitHub upload from the project root
- Netlify frontend deployment
- Render backend deployment
- Railway backend deployment

## Do Not Upload

These are ignored and should stay local:

- `.env`
- `node_modules/`
- `.venv/`
- `backend/venv/`
- `dist/`
- `netlify-dist/`
- `__pycache__/`

## Frontend: Netlify

Build command:

```text
npm run build:netlify
```

Publish directory:

```text
netlify-dist
```

Environment variables:

```text
VITE_BACKEND_HTTP_URL=https://your-backend-url
VITE_BACKEND_WS_URL=wss://your-backend-url
```

## Backend: Render

Use `render.yaml`, or configure manually:

```text
Root directory: backend
Build command: pip install -r requirements.txt
Start command: python run_server.py
Health check path: /health
```

## Backend: Railway

Use backend root directory:

```text
backend
```

Start command:

```text
python run_server.py
```

Health check path:

```text
/health
```

## Local Run

Backend:

```powershell
backend\venv\Scripts\python.exe backend\run_server.py
```

Frontend:

```powershell
npm.cmd run dev -- --host 127.0.0.1 --port 5173
```
