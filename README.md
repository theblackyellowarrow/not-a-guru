# Not a Guru

A Vite + React app for project framing, process review, and design critique.

## What this project includes

- A React UI split into focused components
- Local thread persistence with `localStorage`
- PDF, DOCX, and image ingestion
- A server-side OpenAI proxy at `api/openai.js`
- GitHub Actions for CI

## Runtime setup

Use Node `24.14.1` for local work. The repo includes `.nvmrc`, and the app also builds on Vercel within the supported `>=20.19.0 <25` range.

```bash
nvm use
npm ci
cp .env.example .env
npm run dev
```

The app runs on `http://localhost:3000`.

## Environment variables

Copy `.env.example` and set the values you need:

- `OPENAI_API_KEY`
  Use this on the server or hosting platform for the secure proxy.
- `VITE_OPENAI_PROXY_URL`
  Defaults to `/api/openai`.
- `VITE_OPENAI_MODEL`
  Defaults to `gpt-5.4-mini`.

## Local build

```bash
npm run build
```

The production files are generated in `dist/`.

## GitHub repo hygiene

This repo includes:

- `.github/workflows/ci.yml` to install and build on pushes and pull requests
- `.nvmrc` so collaborators land on a working Node version faster

## Deployment options

### Recommended public deployment

Use a platform that can host both the static frontend and the `api/openai.js` serverless function from this GitHub repo, such as Vercel.

Why this is the recommended path:

- The OpenAI key stays server-side as `OPENAI_API_KEY`
- The frontend talks to `/api/openai`
- The app can be publicly accessible without shipping the real key to the browser

For this setup:

1. Import the GitHub repo into Vercel.
2. Set `OPENAI_API_KEY` in the Vercel project environment.
3. Optionally set `VITE_OPENAI_PROXY_URL=/api/openai`.
4. Optionally set `VITE_OPENAI_MODEL=gpt-5.4-mini`.

`vercel.json` is included for SPA routing.

## Remaining recommended cleanup

1. Reinstall dependencies cleanly on a supported Node version and re-run the build.
2. Add tests for onboarding, uploads, and tool actions.
3. Add upload size limits and clearer file validation rules.
4. Add `OPENAI_API_KEY` to the Vercel project before going live.
