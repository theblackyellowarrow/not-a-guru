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

## Modes and flows

The app now has three chat-only entry points:

1. **Build a Problem Statement** (`start_project`) — a guided chat from raw idea to scored problem statement, then solution statement, then a proposed future workflow.
2. **Design Process Critique** (`process_review`) — a chat critique of the user's process; PDFs/images can be uploaded as the conversation progresses.
3. **Final Roast** (`final_review`) — a chat critique of completed work; uploads happen in-chat.

Stage markers (`### PROBLEM_STATEMENT_READY`, `### SOLUTION_STATEMENT_READY`) are control signals produced by the model and stripped from rendered output. Structured scoring and workflow passes are browser-side calls to the existing `/api/openai` proxy.

## Priority areas

- Security: remove direct browser exposure of model access.
- Reliability: improve parsing, loading, and error states.
- Structure: keep components separated and readable.
- Tone: keep the voice direct, attentive, and context-aware.
