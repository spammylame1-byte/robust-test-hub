# Rewire frontend to a separate Express backend

Goal: replace the two mock touchpoints (`src/data/features.json` static import and `src/lib/mock-run.ts`) with HTTP calls to your Express server. Everything else (components, store shape, URL state, types) stays as-is.

## Backend contract you'll implement

Just so the frontend has a target — your Express app needs two endpoints:

- `GET /features` → returns the array currently in `feature-summary.json` (same shape as `src/data/features.json`, i.e. `Feature[]`).
- `POST /run` with body `{ scenarioId, featureName, scenarioName }` → spawns cucumber for that one scenario, reads `cucumber-report.json`, returns:
  ```
  { status: "pass" | "fail", durationMs: number, output: string, error?: string }
  ```

Enable CORS for the dashboard origin (`cors()` middleware, allow `Content-Type`).

## Frontend changes

### 1. Add an API base URL env var
- Create `.env` with `VITE_API_BASE_URL=http://localhost:3001` (whatever port Express uses).
- Read it via `import.meta.env.VITE_API_BASE_URL` (no server-side secrets needed — this is a public URL).

### 2. New file: `src/lib/api.ts`
Thin fetch wrapper with two functions:
- `fetchFeatures(): Promise<Feature[]>` → `GET ${BASE}/features`
- `runScenario(payload): Promise<RunResult>` → `POST ${BASE}/run`, maps response to `RunResult` (just spreads + adds `ranAt: Date.now()`).

Throws on non-2xx so callers can surface errors.

### 3. Rewrite `src/store/runs.ts`
Replace the `runScenarioMock` import with `runScenario` from `@/lib/api`. Signature of `run(scenario, background)` stays identical — components don't change. On thrown errors, set status to `"fail"` with the error message in `error`.

### 4. Update `src/routes/index.tsx` to fetch the catalog
Swap the static `featuresData` import for TanStack Query:
- Define `featuresQueryOptions` using `fetchFeatures`.
- Loader: `context.queryClient.ensureQueryData(featuresQueryOptions)`.
- Component: `const { data: features } = useSuspenseQuery(featuresQueryOptions)`.
- Add `errorComponent` and `pendingComponent` (small loading + error states) since the loader can now fail.

### 5. Delete `src/data/features.json` and `src/lib/mock-run.ts`
Once the two changes above land, both are dead code.

## What does NOT change

- `src/types/cucumber.ts` (`Feature`, `Scenario`, `RunResult`, `scenarioId`) — your backend response matches these.
- All dashboard components (`FeatureCard`, `ScenarioRow`, `ScenarioDetailPanel`, `SummaryStats`, `StatusPill`).
- URL search-param state for `?scenario=…`.
- Zustand store shape (`results: Record<string, RunResult>`).

## One thing to confirm

Right now `scenarioId()` prefers the `@TestID_N` tag, falling back to scenario name. For your Express `/run` endpoint to locate the right scenario, easiest is to send both `featureName` and `scenarioName` in the POST body (backend looks them up). If you'd rather key purely by `@TestID_N`, say so and I'll have the backend index by that instead.

## Local dev note

Express on `:3001`, Vite dev on `:5173` → CORS will trip without the `cors` middleware on the backend. No Vite proxy needed if CORS is set; if you'd rather avoid CORS entirely, we can configure `server.proxy` in `vite.config.ts` to forward `/api/*` to Express instead — let me know which you prefer.
