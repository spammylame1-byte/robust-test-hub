import { createServerFn } from "@tanstack/react-start";
import type { Feature } from "@/types/cucumber";

function resolveFeaturesPath() {
  // Default to parse_features/feature-summary.json since main.js writes it there.
  const def = "parse_features/feature-summary.json";
  return process.env.FEATURES_JSON_PATH ?? def;
}

export const getFeatures = createServerFn({ method: "GET" }).handler(async () => {
  const { readFile } = await import("node:fs/promises");
  const { resolve } = await import("node:path");
  const raw = await readFile(resolve(process.cwd(), resolveFeaturesPath()), "utf8");
  return JSON.parse(raw) as Feature[];
});

export const reloadFeaturesFn = createServerFn({ method: "POST" }).handler(
  async (): Promise<{ ok: true; count: number; output: string } | { ok: false; error: string; output: string }> => {
    const { spawn } = await import("node:child_process");
    const { readFile } = await import("node:fs/promises");
    const { resolve } = await import("node:path");

    const cwd = resolve(process.cwd(), process.env.PARSE_FEATURES_CWD ?? "parse_features");

    const isWin = process.platform === "win32";
    const child = spawn("node", ["main.js"], { cwd, env: process.env, shell: isWin });

    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (b) => (stdout += b.toString()));
    child.stderr?.on("data", (b) => (stderr += b.toString()));

    const exitCode: number = await new Promise((res) => {
      child.on("close", (code) => res(code ?? 1));
      child.on("error", () => res(1));
    });

    const output = (stdout + (stderr ? `\n${stderr}` : "")).trim();

    if (exitCode !== 0) {
      return { ok: false, error: `node main.js exited with code ${exitCode}`, output };
    }

    try {
      const raw = await readFile(resolve(process.cwd(), resolveFeaturesPath()), "utf8");
      const features = JSON.parse(raw) as Feature[];
      return { ok: true, count: features.length, output };
    } catch (e) {
      return { ok: false, error: (e as Error).message, output };
    }
  },
);
