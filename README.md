# YECHIM CRM Frontend

This repository is the frontend source for YECHIM CRM. The canonical backend
is maintained separately in `umidjon2272/yechim-backend` and is deployed to
Render from that repository root.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend is a React + Vite app. API requests go to the canonical Render
backend at `https://yechim-backend.onrender.com/api` (or `VITE_API_URL`).

## Deployment notes

- Vercel frontend project: set Root Directory to `frontend`.
- Render backend service: use the separate `yechim-backend` repository root.
- Production frontend authentication uses only the canonical Render API and a validated
  access/refresh token pair. `backend/mock-server` is local-only test data and
  is not referenced by the Vercel build. The legacy `backend/` directory in
  this working tree is retained temporarily pending explicit removal approval;
  it is not a deployment source.
