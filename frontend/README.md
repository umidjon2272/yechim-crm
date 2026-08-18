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

Authentication is tab-scoped: each tab keeps its access and refresh token in
its own `sessionStorage` and sends the access token as a Bearer header. The
frontend restores the current tab by calling `/api/auth/me`; it does not use a
localStorage user object or browser-wide auth cookies.
