# GitHub Deployment Notes

Upload this project folder to GitHub.

Do not upload local dependency or build folders:

- `node_modules/`
- `.venv/`
- `.venv-1/`
- `backend/venv/`
- `dist/`
- `netlify-dist/`
- `.wrangler/`
- `.tanstack/`

These are already covered by `.gitignore`.

## Frontend: Netlify

Connect the GitHub repo to Netlify.

Use these build settings:

```text
Build command: npm run build:netlify
Publish directory: netlify-dist
```

After deploying the backend, add these Netlify environment variables:

```text
VITE_BACKEND_HTTP_URL=https://your-backend-url
VITE_BACKEND_WS_URL=wss://your-backend-url
```

Then redeploy Netlify.

## Backend: Railway

Create a Railway service from the same GitHub repo.

Use the `backend` folder as the service root if Railway asks for a root directory.

```text
Install command: pip install -r requirements.txt
Start command: python run_server.py
Health check path: /health
```

The included `backend/railway.json` and `backend/Procfile` are ready for this backend service.

## Backend: Render

Render can use the root `render.yaml`, or you can create a Web Service manually:

```text
Root directory: backend
Build command: pip install -r requirements.txt
Start command: python run_server.py
Health check path: /health
```

## Local Check

Backend:

```powershell
cd backend
python run_server.py
```

Frontend:

```powershell
npm install
npm run dev -- --host 127.0.0.1 --port 5173
```
