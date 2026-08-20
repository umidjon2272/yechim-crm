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

Authentication stores only the access/refresh token pair in `localStorage` so
the installed PWA can reopen without asking for credentials again. The
frontend never trusts a stored user object: it refreshes the access token when
needed and restores the current identity and permissions through
`/api/auth/me`. Logout or a revoked/expired refresh session clears the tokens.
