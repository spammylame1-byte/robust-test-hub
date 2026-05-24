type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [k: string]: JsonValue };

export interface Scenario {
  name: string;
  type: string;
  tags: string[];
  steps: string[];
  examples: JsonValue[];
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
