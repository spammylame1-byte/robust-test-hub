# Cucumber Test Dashboard — Plan

A practical, sturdy, blue-leaning dashboard that groups parsed Cucumber `.feature` data by feature, drills into scenarios, and exposes a mock "Run Test" action ready to be wired to a real backend later.

## Visual direction

- Bluish, utilitarian, slightly industrial — think internal tooling (Jenkins/Grafana-adjacent), not marketing site.
- Tight spacing, clear borders, monospaced text for steps and tags, minimal motion.
- Tokens added to `src/styles.css`:
  - `--background` near-white with faint blue tint, `--foreground` deep slate-blue
  - `--primary` strong navy/steel blue, `--accent` lighter steel blue
  - Semantic status tokens: `--status-pass`, `--status-fail`, `--status-pending`, `--status-running` (plus `*-foreground`) and matching `--color-*` registrations under `@theme inline`
  - Slightly reduced `--radius` (~0.375rem) for a more "engineered" feel
- Mono font for steps/tags via Tailwind's `font-mono`.

## Data layer

- `src/data/features.json` — the example payload the user pasted, ready to swap for an API.
- `src/types/cucumber.ts` — `Feature`, `Scenario`, `Step`, `RunStatus = 'idle' | 'running' | 'pass' | 'fail'`, `RunResult { status, durationMs, output, error?, ranAt }`.
- `src/store/runs.ts` — small Zustand store keyed by scenario tag/id holding `RunResult`. Survives navigation; no persistence needed v1.
- `src/lib/mock-run.ts` — `runScenario(scenario)` returns a Promise that resolves after 600–1800 ms random latency, ~75% pass / 25% fail, generates a plausible stdout block and (on fail) an error message referencing one of the scenario's steps.

## Routes & layout

Single dashboard route with a master-detail side panel — no per-scenario route.

- `src/routes/__root.tsx` — keep shell; add header (app title, summary stats inline on the right).
- `src/routes/index.tsx` — the dashboard. Two-pane layout:
  - Left/main: feature list (accordion of feature cards). Each feature card shows name, tag chips, scenario count, mini pass/fail bar. Expanding reveals its scenario rows.
  - Right: `Sheet` (shadcn) side panel that opens when a scenario is selected, showing full detail.
- Selection state lives in URL search params (`?scenario=<testId>`) so deep links and back-button work without separate routes.

## Components

- `components/dashboard/SummaryStats.tsx` — top strip: total features, total scenarios, runs executed, pass rate, fail count. Pulls counts from data + runs store.
- `components/dashboard/FeatureCard.tsx` — collapsible card (uses `Accordion` or `Collapsible`); header shows name, tags, scenario count, pass/fail mini-bar.
- `components/dashboard/ScenarioRow.tsx` — row inside a feature: scenario name, TestID tag, status pill, `Run Test` button, `Details` button. Run button shows spinner while running and updates the pill on completion.
- `components/dashboard/ScenarioDetailPanel.tsx` — the `Sheet` content: scenario name, tags, background steps (from parent feature) + scenario steps in a mono block, last run status, duration, stdout output, error message if failed, and a `Run Test` button that mirrors the row action.
- `components/dashboard/StatusPill.tsx` — small badge styled with the status tokens.

## Run flow (mock)

1. User clicks `Run Test` on a row or in the detail panel.
2. Store sets that scenario's status to `running`.
3. `mock-run.ts` resolves with a result; store updates to `pass`/`fail` with output/error.
4. UI re-renders pill, mini-bar in feature card, and summary stats automatically.
5. `runScenario` is isolated so swapping it for a real `createServerFn` call later is a one-file change.

## File changes

New:
- `src/data/features.json`
- `src/types/cucumber.ts`
- `src/lib/mock-run.ts`
- `src/store/runs.ts`
- `src/components/dashboard/` (5 files above)

Edited:
- `src/styles.css` — add blue palette + status tokens, register under `@theme inline`.
- `src/routes/__root.tsx` — header with app title; update `<title>`/meta to "Cucumber Test Dashboard".
- `src/routes/index.tsx` — replace placeholder with the dashboard.

Dependency: `zustand` (via `bun add`).

## Out of scope for v1

Real backend wiring, bulk run, search/filter, dark mode, persistence, auth — all easy to add on top of this structure later.
