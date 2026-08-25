# YECHIM CRM

Monorepo structure for the YECHIM CRM frontend and backend.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend is a React + Vite app. By default, API requests go to the Render
backend at `https://yechim-backend.onrender.com/api`.

## Backend

The production backend is deployed on Render:
`https://yechim-backend.onrender.com`.

Local mock API, if needed:

```bash
cd backend/mock-server
npm install
npm start
```

## Deployment notes

- Vercel frontend project: set Root Directory to `frontend`.
- Render backend service: set Root Directory to `backend`.
- Production frontend authentication uses only the Render API and a validated
  access/refresh token pair. `backend/mock-server` is local-only test data and
  is not referenced by the Vercel build.
