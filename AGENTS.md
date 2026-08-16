# Repository instructions for Codex

## Project shape

This is a Vite + React prototype extracted from a single-file app.

## Working rules

- Preserve the dark, sharp UI language.
- Keep British English in user-facing copy.
- Avoid adding corporate UX filler.
- Treat the critique structure and flow logic as core behaviour.
- Prefer small component-level edits over giant rewrites.
- Keep browser-only assumptions explicit.
- When touching AI calls, document whether the change is browser-side or server-side.

## User sessions

- Threads are keyed by username. `App` stores threads in `localStorage` under a per-user map.
- The landing screen asks for a username and then restores the user's last active thread, or lets them start a new quest.
- Each thread records `username`, `flow`, `projectContext`, `messages`, and `title`.

## Modes and flows

The app has three chat entry points:

1. **Build a Problem Statement** (`start_project`) — a guided chat from raw idea to scored problem statement, then solution statement, then a proposed future workflow.
2. **Design Process Critique** (`process_review`) — a chat critique of the user's process; the tone starts gentle and becomes progressively tougher. It explicitly critiques the process, not the solution.
3. **Final Roast** (`final_review`) — a chat critique of completed work; uploads happen in-chat.

Stage markers are flow-specific. The model emits markers when a stage is complete:

- `start_project`: `### PROBLEM_STATEMENT_READY`, `### SOLUTION_STATEMENT_READY`
- `process_review`: `### PROCESS_FRAMING_REVIEWED`, `### PROCESS_TRACE_REVIEWED`, `### PROCESS_EVIDENCE_REVIEWED`
- `final_review`: `### FINAL_FRAMING_REVIEWED`, `### FINAL_OUTPUT_REVIEWED`, `### FINAL_TRADE_OFF_REVIEWED`

Stage markers are control signals produced by the model and stripped from rendered output. Each scored stage creates a `score_card` message. When every scored stage is complete, the user can download a dotai marksheet/certificate.

Structured scoring and workflow passes are browser-side calls to the existing `/api/openai` proxy.

## URL routing

The SPA uses hash routes. Chat sessions are reflected in the URL as `#/chat/{threadId}`. The onboarding screen clears the hash. Routing is disabled in embed mode.

## Priority areas

- Security: remove direct browser exposure of model access.
- Reliability: improve parsing, loading, and error states.
- Structure: keep components separated and readable.
- Tone: keep the voice direct, attentive, and context-aware.

## Design system

The authoritative product design guide is `dotaitooldesign.md` in this repo. Key rules for this codebase:

- **Cyan (`#00F1DE`) carries the product field.** Use it for primary structure, navigation states, open panels, progress tracks and the dominant body of vector forms.
- **Fuchsia (`#FF00A8`) is the accent of intervention.** Use it only for the exact point of action: primary action, current focus, live annotation, decisive state, and the visual peak of an animation. Keep it to ~2–6 % of a normal screen.
- **Cyan and fuchsia meet in gradients and line transitions**, but they do not perform the same interface role.
- **Not a Guru vector signature:** a cyan `Split` line with fuchsia `Pulse` moments — splitting marginal lines for diverging positions, pulse marks for claims, doubts or interventions.
- **Typography:** IBM Plex Sans for UI text, IBM Plex Mono for labels/metadata/code, Source Serif 4 for long reading.
- **Shape language:** hard-edged or lightly clipped panels (radius 0–4 px), 1 px default rules, 2 px cyan active rules, minimal shadows. Fuchsia is reserved for the focus ring and intervention moments.
- **Magic UI / GenUAI components** may be copied in, but they must be renamed semantically, tokenised to the cyan-fuchsia hierarchy, made accessible and given reduced-motion behaviour.

## Design references

- **Magic UI** — https://github.com/magicuidesign/magicui / https://magicui.design/docs  
  A copy-paste UI library for design engineers: animated React components and effects built with TypeScript, Tailwind CSS, and Framer Motion. Useful for adding polished, motion-rich UI elements while keeping the dark, sharp Not a Guru aesthetic.

- **GenUAI** — https://github.com/xKevIsDev/GenUAI  
  An open-source AI-to-UI generation app (forked from llamacoder) that generates small apps from one prompt. Built with Next.js, Tailwind, Sandpack, and component libraries including Shadcn, Aceternity, MagicUI, and SyntaxUI. Useful as a reference for prompt-driven component generation and sandbox previews.
