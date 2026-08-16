# YECHIM CRM

Monorepo structure for the YECHIM CRM frontend and future backend.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend is a React + Vite app. During local development, Vite proxies
`/api` requests to the mock backend at `http://localhost:4000`.

## Backend

Backend structure is prepared; real NestJS + Prisma + PostgreSQL implementation
is pending.

Current demo/mock API:

```bash
cd backend/mock-server
npm install
npm start
```

## Deployment notes

- Vercel frontend project: set Root Directory to `frontend`.
- Future Render backend service: set Root Directory to `backend`.
- Legacy Vercel demo API code is kept in `backend/legacy-api` for reference.
