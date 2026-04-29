# Adaptive HMI Deployment

## Netlify frontend upload

Upload the contents of `frontend-netlify` to Netlify.

This folder contains only:

- `index.html`
- `_redirects`
- compiled frontend assets
- `config.js`

Do not upload `node_modules`, `.venv`, `backend/venv`, `.wrangler`, `.tanstack`, or old build folders.

## Backend

The FastAPI backend is not a static website, so Netlify drag-and-drop will not run it.
Deploy the `backend` folder to a Python backend host such as Render, Railway, Fly.io, or a VPS.

Backend start command:

```bash
python -m backend.run_server
```

Backend requirements:

```bash
pip install -r backend/requirements.txt
```

## Frontend backend URL

After the backend is deployed, set these Netlify environment variables and rebuild:

```bash
VITE_BACKEND_HTTP_URL=https://your-backend-url
VITE_BACKEND_WS_URL=wss://your-backend-url
```

For drag-and-drop upload without rebuilding, edit `frontend-netlify/config.js` before upload:

```js
window.ADAPTIVE_HMI_CONFIG = {
  BACKEND_HTTP_URL: "https://your-backend-url",
  BACKEND_WS_URL: "wss://your-backend-url",
};
```

For local testing, the frontend uses:

```bash
http://127.0.0.1:8000
ws://127.0.0.1:8000
```

## Shared signal behavior

There is one shared Signal Adjustment page. Temperature and vibration are sent to the backend once, then the same backend state feeds all roles:

- Operator
- Worker
- Producer
- Supervisor
- Manager
- Maintenance

When temperature is above `90 C` and vibration is `7 mm/s` or higher, the backend creates a shared critical alert for all role dashboards.
