import type { RunResult, Scenario } from "@/types/cucumber";

function randomBetween(min: number, max: number) {
  return Math.floor(Math.random() * (max - min) + min);
}

function buildOutput(scenario: Scenario, background: string[], passed: boolean, failedStep?: string) {
  const lines: string[] = [];
  lines.push(`[cucumber] Running scenario: ${scenario.name}`);
  lines.push(`[cucumber] Tags: ${scenario.tags.join(" ") || "(none)"}`);
  for (const s of background) lines.push(`  ✓ ${s}`);
  for (const s of scenario.steps) {
    if (!passed && s === failedStep) {
      lines.push(`  ✗ ${s}`);
      break;
    }
    lines.push(`  ✓ ${s}`);
  }
  lines.push("");
  lines.push(passed ? "[cucumber] Scenario PASSED" : "[cucumber] Scenario FAILED");
  return lines.join("\n");
}

const ERRORS = [
  "AssertionError: expected element to be visible",
  "TimeoutError: waiting for selector exceeded 5000ms",
  "ConnectionError: ECONNREFUSED",
  "AssertionError: expected status 200 but got 500",
];

export async function runScenarioMock(
  scenario: Scenario,
  background: string[] = [],
): Promise<RunResult> {
  const duration = randomBetween(600, 1800);
  await new Promise((r) => setTimeout(r, duration));
  const passed = Math.random() < 0.75;
  const failedStep = !passed
    ? scenario.steps[randomBetween(0, scenario.steps.length)]
    : undefined;
  return {
    status: passed ? "pass" : "fail",
    durationMs: duration,
    output: buildOutput(scenario, background, passed, failedStep),
    error: passed ? undefined : `${ERRORS[randomBetween(0, ERRORS.length)]}\n  at step: ${failedStep}`,
    ranAt: Date.now(),
  };
}
