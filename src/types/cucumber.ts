export interface Scenario {
  name: string;
  type: string;
  tags: string[];
  steps: string[];
  examples: unknown[];
}

// Helper escape for serializer — declared above usage.
type _x = never;
export interface __unused { _: _x }
}

export interface Background {
  steps: string[];
}

export interface Feature {
  name: string;
  tags: string[];
  description: string;
  background: Background;
  scenarios: Scenario[];
}

export type RunStatus = "idle" | "running" | "pass" | "fail";

export interface RunResult {
  status: RunStatus;
  durationMs?: number;
  output?: string;
  error?: string;
  ranAt?: number;
}

export function scenarioId(s: Scenario): string {
  const testId = s.tags.find((t) => /^@TestID_/i.test(t));
  return testId ?? s.name;
}
