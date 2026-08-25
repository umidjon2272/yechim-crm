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
- Legacy Vercel demo API code is kept in `backend/legacy-api` for reference.
