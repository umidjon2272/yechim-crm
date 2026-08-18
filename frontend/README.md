# YECHIM CRM Frontend

React + Vite frontend for YECHIM CRM.

```bash
npm install
npm run dev
npm run build
```

By default, API requests go to the Render backend:
`https://yechim-backend.onrender.com/api`.

Set the Vercel environment variable below to the Render API origin, including
the `/api` prefix:

```env
VITE_API_URL=https://yechim-backend.onrender.com/api
```

Authentication is cookie-based; the browser must be allowed to send
cross-origin credentials to the Render API. No access or refresh token is
stored in localStorage/sessionStorage.
