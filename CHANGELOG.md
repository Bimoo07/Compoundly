# Changelog

Format: [Keep a Changelog](https://keepachangelog.com/), versioning: SemVer 0.x.

## [0.7.0] - 2026-10-12
### Security
- Gemini API key removed from the client bundle; all calls go through the Netlify Function `/api/gemini` (origin check, size limits, rate limit, no prompt logging).
- Client no longer depends on `@google/genai`.
### Added
- Crisis guardrail v2.0.0: compiled phrase lexicon (id/en), symmetric normalization, idiom neutralization, locale detection; journal tags and recent entries are checked.
- Labeled evaluation set + `scripts/evalGuardrail.mjs` (sensitivity/specificity with Wilson 95% CI) and regression test.
- Build info (version, commit, date) in Settings.

## [0.6.0] - 2026-10-11
### Added
- AI feedback in Journal and Burl Effect (`withNarrativeGuard`: crisis check -> AI -> output validation -> deterministic fallback).
- Reset Progress in Settings; selecting a different habit resets the experiment.
### Fixed
- Recovery days computed on UTC calendar days.
- Settings button visible on all phases; BINUS text in sidebar.
- Gemini: default model `gemini-3.8-flash`, thinking LOW, timeout, retry with fallback model on 503.
