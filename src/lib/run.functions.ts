import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const RunInput = z.object({
  scenarioId: z.string().min(1),
  featureName: z.string().min(1),
  scenarioName: z.string().min(1),
});

export interface RunResponse {
  status: "pass" | "fail";
  durationMs: number;
  output: string;
  error?: string;
}

export const runScenarioFn = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => RunInput.parse(input))
  .handler(async ({ data }): Promise<RunResponse> => {
    const { spawn } = await import("node:child_process");
    const { readFile, mkdtemp, rm } = await import("node:fs/promises");
    const { tmpdir } = await import("node:os");
    const { join, resolve } = await import("node:path");

    const cwd = process.env.CUCUMBER_CWD
      ? resolve(process.env.CUCUMBER_CWD)
      : process.cwd();
    const cucumberBin = process.env.CUCUMBER_BIN ?? "npx";
    const baseArgs = process.env.CUCUMBER_BIN
      ? []
      : ["cucumber-js"];

    const tmp = await mkdtemp(join(tmpdir(), "cuke-"));
    const reportPath = join(tmp, "cucumber-report.json");

    // Prefer filtering by @TestID_* tag; fall back to scenario name.
    const isTagId = /^@?TestID_/i.test(data.scenarioId);
    const filterArgs = isTagId
      ? ["--tags", data.scenarioId.startsWith("@") ? data.scenarioId : `@${data.scenarioId}`]
      : ["--name", data.scenarioName];

    const args = [
      ...baseArgs,
      "--format",
      `json:${reportPath}`,
      ...filterArgs,
    ];

    const started = Date.now();
    const child = spawn(cucumberBin, args, { cwd, env: process.env });

    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (b) => (stdout += b.toString()));
    child.stderr?.on("data", (b) => (stderr += b.toString()));

    const exitCode: number = await new Promise((res) => {
      child.on("close", (code) => res(code ?? 1));
      child.on("error", () => res(1));
    });

    let durationMs = Date.now() - started;
    let status: "pass" | "fail" = exitCode === 0 ? "pass" : "fail";
    let errorMsg: string | undefined;
    let output = stdout || stderr;

    try {
      const reportRaw = await readFile(reportPath, "utf8");
      const report = JSON.parse(reportRaw) as Array<{
        name: string;
        elements?: Array<{
          name: string;
          type: string;
          tags?: Array<{ name: string }>;
          steps?: Array<{
            keyword: string;
            name: string;
            result?: { status: string; duration?: number; error_message?: string };
          }>;
        }>;
      }>;

      // Find the matching scenario element across features
      let matched: NonNullable<(typeof report)[number]["elements"]>[number] | undefined;
      for (const feat of report) {
        for (const el of feat.elements ?? []) {
          if (el.type !== "scenario") continue;
          const hasTag = (el.tags ?? []).some(
            (t) => t.name === (data.scenarioId.startsWith("@") ? data.scenarioId : `@${data.scenarioId}`),
          );
          if ((isTagId && hasTag) || (!isTagId && el.name === data.scenarioName)) {
            matched = el;
            break;
          }
        }
        if (matched) break;
      }

      if (matched) {
        let ns = 0;
        const lines: string[] = [];
        let failed = false;
        for (const step of matched.steps ?? []) {
          const st = step.result?.status ?? "unknown";
          ns += step.result?.duration ?? 0;
          lines.push(`  ${st.padEnd(8)} ${step.keyword}${step.name}`);
          if (st === "failed") {
            failed = true;
            if (step.result?.error_message && !errorMsg) {
              errorMsg = step.result.error_message;
            }
          }
        }
        durationMs = Math.round(ns / 1e6);
        status = failed ? "fail" : "pass";
        output = lines.join("\n") || output;
      }
    } catch (e) {
      // No report — keep spawn output + exit code as the signal
      if (!errorMsg && status === "fail") {
        errorMsg = stderr || `cucumber exited with code ${exitCode}`;
      }
    } finally {
      await rm(tmp, { recursive: true, force: true }).catch(() => {});
    }

    return { status, durationMs, output, error: errorMsg };
  });
