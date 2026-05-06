# Not a Guru

A Vite + React app for project framing, process review, and design critique.

## White paper (practitioner note)

### Abstract

Not a Guru is a lightweight critique interface designed to help a user move from vague intent to defensible design work. It targets four recurring situations: early framing, process review, final critique, and venting/FAQ. The system is deliberately opinionated: it biases toward clarity, evidence, and identification of weak assumptions rather than motivational coaching.

### Research motivation and scope

Design work fails in predictable ways: problem statements drift away from evidence, solutions harden too early, and final outputs are defended by aesthetic preference rather than traceable constraints. Not a Guru is built as an intervention at three points in the lifecycle:

- Framing: make the problem statement and success criteria explicit before solutioning.
- Process: connect artefacts to their underlying research and reveal missing work.
- Final: critique execution against desirability, viability, feasibility, inclusion, and long-term cost.

This is not a diagnostic instrument and does not claim ground-truth evaluation. It is a structured conversation tool intended to increase the quality of reasoning and documentation.

### Interaction model

The user chooses one mode. The system maintains a local thread history (stored in the browser) and uses a server-side OpenAI proxy to produce responses. The UI is intentionally sparse and sharp to keep attention on content rather than interface novelty.

The critique style is:

- Direct and compact.
- Evidence-seeking: "What supports this claim?"
- Assumption-tracing: "What must be true for this to work?"
- Exclusion-aware: "Who is missing? What costs are externalised?"

### Mode definitions

1. Start a New Vibe
   - Objective: turn a raw idea into a defensible problem statement and a bounded solution direction.
   - Method: keep the user on a single stage at a time and end with one precise next question.

2. Process Check
   - Objective: critique process artefacts by tracing outputs back to research quality and coherence.
   - Method: upload documents (PDF/DOCX/images). The critique highlights missing links (claims without evidence, unexplained leaps, thin stakeholder mapping).

3. Final Roast
   - Objective: critique a final design as a situated artefact with trade-offs.
   - Method: upload framing docs plus final assets. The critique checks alignment first, then critiques desirability/viability/feasibility/inclusion/ethics.

4. Just Venting / FAQ
   - Objective: allow decompression without losing forward motion.
   - Method: acknowledge, then offer a short option to continue venting or return to the work.

### Data handling and threat model (practical)

- The OpenAI API key is never shipped to the browser. The frontend calls a serverless proxy at `api/openai.js`.
- Threads are stored in `localStorage` for convenience; they are not encrypted at rest in the browser.
- Uploads are processed client-side into either base64 (images) or extracted text (PDF/DOCX) before being sent to the proxy.

Risk notes:

- If you paste confidential material, it will be sent to the configured model provider. Do not use this for regulated or sensitive data without a proper policy review.
- Browser storage is not a secure vault. Anyone with local access to the device profile can read `localStorage`.

### Performance notes

PDF and DOCX parsing libraries are lazy-loaded so the initial page load stays lean.

### System architecture (implementation notes)

At runtime, the system is a single-page app plus a serverless proxy:

- Frontend: Vite + React. Conversation threads persist in `localStorage`.
- Proxy: `api/openai.js` translates the app's message structure into OpenAI Responses API requests, keeping `OPENAI_API_KEY` on the server.

Data flow:

1. User enters a message (and optionally attaches a file).
2. The browser normalises message parts and (for PDFs/DOCX) extracts text locally.
3. The browser POSTs to `/api/openai` with the current context window.
4. The proxy calls `https://api.openai.com/v1/responses` and returns the response.

This architecture is intentionally minimal. It optimises for deployability on Vercel and for keeping credentials server-side.

### Evaluation (what "good" looks like)

Not a Guru is best evaluated by whether it improves the quality of work produced, not by whether it produces agreeable conversation. Practical indicators:

- The user ends a framing session with a concrete problem statement and constraints.
- Process review highlights specific missing evidence or weak links between artefacts.
- Final critique names trade-offs with clear rationales (not vibes).

### Limitations

- The system cannot validate factual claims in uploaded documents without external verification.
- Browser storage is convenient, not secure.
- Model outputs can be wrong; the tool is a critique aid, not an authority.

## What this project includes

- A React UI split into focused components
- Local thread persistence with `localStorage`
- PDF, DOCX, and image ingestion
- A server-side OpenAI proxy at `api/openai.js`
- GitHub Actions for CI

## How to use

1. Start a New Vibe: talk through a raw idea and sharpen it into a clear problem and solution.
2. Process Check: upload research/process documents and get a critique tied to the evidence.
3. Final Roast: upload final assets plus framing docs for a direct critique of the final output.
4. Just Venting / FAQ: short support and quick directional questions.

Use the in-app **How to Use** button to see the same guidance.

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
  Defaults to `gpt-4.1-mini`.

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
4. Optionally set `VITE_OPENAI_MODEL=gpt-4.1-mini`.

`vercel.json` is included for SPA routing.

## Embed in Wix

Use the embed-optimized URL to keep the UI clean inside an iframe:

`https://not-a-guru.vercel.app/?embed=1`

In Wix:

1. Add -> Embed -> HTML iframe.
2. Set the iframe URL to the embed link above.
3. Set width to 100% and height to 800-1000px.

### Optional: auto-resize the Wix HTML component

If you are embedding via a Wix HTML element with Velo enabled, you can auto-resize the embed so it does not create an oversized scroll area.

1. Use the embed URL in the HTML component.
2. Add this page code (Velo) and set `#html1` to your HTML element ID:

```js
import { onMessage } from 'wix-window-frontend';

$w.onReady(() => {
  onMessage((event) => {
    const data = event.data;
    if (data?.type === 'not-a-guru:resize' && typeof data.height === 'number') {
      const nextHeight = Math.max(520, Math.min(1100, Math.floor(data.height)));
      $w('#html1').height = nextHeight;
    }
  });
});
```

The app posts `{ type: 'not-a-guru:resize', height }` messages to its parent when `?embed=1` is set.

## Remaining recommended cleanup

1. Reinstall dependencies cleanly on a supported Node version and re-run the build.
2. Add tests for onboarding, uploads, and tool actions.
3. Add upload size limits and clearer file validation rules.
4. Add `OPENAI_API_KEY` to the Vercel project before going live.
