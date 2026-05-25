## Goal

Run the app on the Node runtime in dev (and for deploy), so `spawn()` in `runScenarioFn` actually works. Drop Cloudflare Workers as the target.

## Changes

### 1. `vite.config.ts` — remove Cloudflare plugin entirely
- Delete the `import { cloudflare } from "@cloudflare/vite-plugin"`.
- Delete the `if (command === "build") plugins.push(cloudflare(...))` branch.
- Pass `customViteReactPlugin: true` to `tanstackStart({...})` so it doesn't inject a second `@vitejs/plugin-react` (this is what's causing the `tanstack-start-injected-head-scripts:v` virtual-module resolution failure in dev).
- Final plugin order: `tailwindcss → tsConfigPaths → tanstackStart({ customViteReactPlugin: true, ... }) → react`.

With no Cloudflare plugin registered, the SSR environment falls back to Vite's default Node-based dev runner, which is what we want.

### 2. `src/server.ts` — keep, but it's now a Node handler
The current shape (`export default { fetch }`) is the Workers convention. For a Node server we need a Node entry. Two options:

- **(a) Drop the custom wrapper** and let TanStack Start's built-in Node server entry handle it. Simplest. We lose the catastrophic-500 normalizer, but Node prints uncaught errors to stdout natively, so logs aren't swallowed the way they were on Workers.
- **(b) Keep the wrapper** but rewrite it as a Node `http.createServer` that calls into `@tanstack/react-start/server-entry`'s fetch adapter (`createRequestHandler` from `@tanstack/react-start/server`).

I recommend **(a)** — the wrapper existed to work around h3's Workers swallowing behavior; on Node, default behavior is fine. We delete `src/server.ts`, `src/lib/error-capture.ts`, and `src/lib/error-page.ts`, and remove the `server: { entry: "server" }` override from `tanstackStart()`.

### 3. `wrangler.jsonc` — delete
Not needed without Workers.

### 4. `package.json`
- Remove `@cloudflare/vite-plugin` and `wrangler` from `devDependencies` (if present).
- Confirm `dev`/`start` scripts target Node. TanStack Start v1's default dev script is `vite dev` (Node runtime). For production, add `"start": "node .output/server/index.mjs"` or similar — TanStack Start emits a Node bundle by default when no Workers preset is configured.

### 5. `.env` — no change
`FEATURES_JSON_PATH` and `CUCUMBER_CWD` keep working; `process.env` is real Node now.

### 6. `src/lib/features.functions.ts` — graceful empty-state on `ENOENT`
Wrap `readFile` in try/catch; on `ENOENT`, return `{ features: [], error: "feature-summary.json not found at <path>" }`. Update return type accordingly.

### 7. `src/routes/index.tsx` — surface empty-state
If features query returns `{ features: [], error }`, render a small panel telling the user to point `FEATURES_JSON_PATH` at their parsed file. (Optional polish — say the word if you want to skip and just throw instead.)

## What I will NOT touch

- `@tanstack/*` versions
- `src/start.ts`, `src/router.tsx`, `__root.tsx`
- Any dashboard component, store, or types
- `src/lib/run.functions.ts` (it'll just work once we're on Node)

## Open question

For production deploy later: are you planning to (a) run `node` on the same Windows machine where the cucumber project lives, or (b) deploy the dashboard somewhere else and have it shell out via SSH / call a small agent on the cucumber box? Doesn't affect dev — just want to know before we wire deploy scripts.
