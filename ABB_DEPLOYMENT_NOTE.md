# ABB Adaptive HMI Deployment Package

This package is prepared for ABB project handoff with a Netlify frontend and Render backend.

## Frontend: Netlify

- Build command: `npm run build:netlify`
- Publish directory: `netlify-dist`
- Runtime backend placeholders:
  - `VITE_BACKEND_HTTP_URL=https://your-render-backend-url`
  - `VITE_BACKEND_WS_URL=wss://your-render-backend-url`

After Render provides the live backend URL, update `public/config.js` in the deployed frontend package or set the same values as Netlify environment variables.

## Backend: Render

- Root directory: `backend`
- Build command: `pip install -r requirements.txt`
- Start command: `python run_server.py`
- Health check path: `/health`

## Package Notes

The Desktop deliverable excludes local dependency folders, virtual environments, generated build folders, Git metadata, caches, and private `.env` files. It is ready to upload to GitHub or unpack for Netlify and Render setup.
