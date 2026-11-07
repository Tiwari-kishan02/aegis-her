# Aegis

A mobile-first women safety PWA built with React, Vite, Tailwind CSS, and React Router.

## Run locally

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite.

## Production build

```powershell
npm run build
npm run preview
```

## Environment

Copy `.env.example` to `.env` when needed. Demo mode defaults to enabled in the example configuration:

```text
VITE_TEST_MODE=true
```

Real alerts must not be sent while `VITE_TEST_MODE=true`.
