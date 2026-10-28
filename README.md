# Compoundly

A behavior-change web app grounded in the Fogg Behavior Model, Self-Determination
Theory, Future Self-Continuity, and Growth Mindset — built around **Recovery Rate**
and qualitative **Behavioral Evidence** instead of streaks or punitive resets.

## Tech stack

- **Vite + React** — build tooling and UI
- **Tailwind CSS v3** — styling, driven by design tokens in `tailwind.config.js`
- **Zustand** (with `persist` middleware) — state management, LocalStorage-backed
- **Motion** (`motion/react`) — general UI transitions and micro-interactions
- **Anime.js v4** — scoped _only_ to the Burl Effect visualization
- **Google Gemini API** (`@google/genai`) — client-side, NLP-only roles
- **Lucide React** — icons

## Getting started

```bash
npm install
cp .env.example .env
npm run dev
```

Open `http://localhost:5173`.

### Environment variables

See `.env.example`. In short:

- `VITE_USE_MOCK_AI=true` (default) — uses `src/lib/ai/mockGeminiClient.js`,
  reading from `src/mocks/data/`. No API key needed.
- To use the real Gemini API: the browser never holds the key. Calls go to the
  Netlify Function `/api/gemini` (`netlify/functions/gemini.mjs`). Locally, copy
  `.env.example` to `.env`, fill `GEMINI_API_KEY` (no `VITE_` prefix), set
  `VITE_USE_MOCK_AI=false`, and run `npx netlify-cli dev`. In production, set
  `GEMINI_API_KEY` (secret), `GEMINI_MODEL`, `GEMINI_FALLBACK_MODEL` in Netlify.

## Available scripts

| Command           | Does                                 |
| ----------------- | ------------------------------------ |
| `npm run dev`     | Start the Vite dev server            |
| `npm run build`   | Production build to `dist/`          |
| `npm run preview` | Preview the production build locally |
| `npm run lint`    | Run `oxlint`                         |

## Architecture principles

These are non-negotiable — see inline comments throughout `src/lib/` for where
each is enforced:

1. **`lib/psychology/` vs `lib/ai/` — hard separation.** All psychological
   logic (Recovery Rate, Burl trigger detection, growth validation) is
   deterministic JavaScript with zero AI/network dependency. `lib/ai/` is
   NLP-boundary only (turning free text into structured suggestions) and
   never makes the actual behavioral decisions.
2. **Local-first, no backend.** Everything persists to LocalStorage via
   Zustand's `persist` middleware (`compoundly-storage` key). There is no
   server and no database.
3. **Crisis guardrail runs before any AI call, always.** See
   `src/lib/ai/guardrails.js` — wired into `src/lib/ai/index.js` so it can
   never be bypassed by a component forgetting to check.
4. **Data minimization.** Only recent data (e.g. last 7 days of journal
   entries — see `selectRecentJournalEntries` in `growthSlice.js`) should
   ever be sent to the Gemini API, never the full history.
5. **User autonomy over AI suggestion.** The AI (mock or real) only ever
   _suggests_ — habit selection, what counts as a setback, etc. are always
   explicit user actions, never automated.

## Folder structure

```
src/
├── components/       Design-system + shared components (Button, Card, PhaseCard, ...)
├── pages/             One file per screen (JourneyMapPage, AwarenessPage, ...)
├── store/
│   ├── slices/        One Zustand slice per domain (awareness, action, growth, recovery, settings, ...)
│   └── useAppStore.js Combined store with persist middleware
├── lib/
│   ├── psychology/     Deterministic logic — recovery.js, burl.js, growth.js
│   └── ai/              Gemini client (real + mock) + crisis guardrails
├── mocks/data/          Static JSON mocks for Sprint 1 (habitOptions, behavioralScenario, aiReflection)
└── App.jsx              Onboarding gate + view router (state-based, no React Router)
```

Routing is intentionally **not** React Router — `currentView` in Zustand's
`navigationSlice` drives a simple lookup table in `App.jsx`. This app is a
single shell with swapping content, not a multi-route site with deep-linking
needs, so this keeps the dependency list lean.

## Testing status (as of this build)

- ✅ `npm run build` — passes, no errors
- ✅ `npm run lint` (oxlint) — 0 warnings, 0 errors
- ✅ Every module transforms cleanly through Vite's **dev server** (not just
  the production Rollup bundle) — confirmed via `npm run dev` + fetching each
  page/store/lib module and checking for a clean 200 response
- ❌ **No one has visually tested this in a real browser yet.** See "Known
  gaps" below.

## Known gaps / not yet done

Being upfront about what Sprint 1 does **not** cover yet:

- **No automated test suite.** Logic in `lib/psychology/` and
  `lib/ai/guardrails.js` was validated manually during development (ad hoc
  Node scripts, not committed) — there is no `npm test` yet. Adding Vitest
  would be a natural next step.
- **Settings "Account" section was dropped.** The original design included
  a 9th section (email/login, Change Password, Delete Account), but since
  there's no auth/backend, it didn't map to anything real and was left out.
  Revisit if auth is ever added.
- **No visual/interaction QA in a real browser.** Everything has been
  validated via `npm run build`, `npm run lint`, and confirming every module
  transforms cleanly through Vite's dev server — but no one has actually
  clicked through the app in a browser yet. This matters especially for:
  - The 3 animation layers (page morph transitions, PhaseCard/Button
    hover-tap feel, the Burl Effect node-drawing sequence) — timing and feel
    are inherently hard to judge without seeing them run.
  - Mobile breakpoints, especially the ~768px handoff between the sidebar
    (desktop) and bottom tab bar (mobile).
  - The Burl trigger banner on the Action page (requires either waiting 2+
    real days without a check-in, or manually editing `experimentStartDate`
    / `checkIns` in `localStorage['compoundly-storage']` via DevTools to
    simulate it).
- **`SCHEMA.md` and the GitHub Projects task breakdown** haven't been done
  yet — deferred earlier in the project.
