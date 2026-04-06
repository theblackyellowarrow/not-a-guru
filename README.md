# Not a Guru

A Vite + React app for project framing, process review, and design critique.

## What this project includes

- A React UI split into focused components
- Local thread persistence with `localStorage`
- PDF, DOCX, and image ingestion
- A server-side Gemini proxy at `api/gemini.js`
- GitHub Actions for CI and an optional GitHub Pages static demo workflow

## Runtime setup

Use Node `20.19.0` or newer. The repo includes `.nvmrc` for that version.

```bash
nvm use
npm ci
cp .env.example .env
npm run dev
```

The app runs on `http://localhost:3000`.

## Environment variables

Copy `.env.example` and set the values you need:

- `GEMINI_API_KEY`
  Use this on the server or hosting platform for the secure proxy.
- `VITE_GEMINI_PROXY_URL`
  Defaults to `/api/gemini`.
- `VITE_ALLOW_BROWSER_GEMINI`
  Leave this as `false` for public deployments.
- `VITE_GEMINI_API_KEY`
  Optional local-only fallback. Do not use this for public deployments.

## Local build

```bash
npm run build
```

The production files are generated in `dist/`.

## GitHub repo hygiene

This repo includes:

- `.github/workflows/ci.yml` to install and build on pushes and pull requests
- `.github/workflows/deploy.yml` for a static GitHub Pages demo build
- `.nvmrc` so collaborators land on a working Node version faster

## Deployment options

### Recommended public deployment

Use a platform that can host both the static frontend and the `api/gemini.js` serverless function from this GitHub repo, such as Vercel.

Why this is the recommended path:

- The Gemini key stays server-side as `GEMINI_API_KEY`
- The frontend talks to `/api/gemini`
- The app can be publicly accessible without shipping the real key to the browser

For this setup:

1. Import the GitHub repo into Vercel.
2. Set `GEMINI_API_KEY` in the Vercel project environment.
3. Optionally set `VITE_GEMINI_PROXY_URL=/api/gemini`.
4. Leave `VITE_ALLOW_BROWSER_GEMINI=false`.

`vercel.json` is included for SPA routing.

### GitHub Pages

GitHub Pages can still host the frontend as a static demo, but it cannot run the secure proxy.

That means:

- You would need to enable browser-side Gemini access to make AI features work there.
- Any browser-side Gemini key can still be extracted by users.
- GitHub Pages is fine for a non-sensitive demo, not for a secure public production deployment.

## Remaining recommended cleanup

1. Reinstall dependencies cleanly on Node `20.19+` and re-run the build.
2. Add tests for onboarding, uploads, and tool actions.
3. Add upload size limits and clearer file validation rules.
4. Decide whether committed `dist/` and `node_modules/` content should be removed from version control.
