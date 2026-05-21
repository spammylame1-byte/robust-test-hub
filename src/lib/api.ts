import type { Feature, RunResult, Scenario } from "@/types/cucumber";
import { scenarioId } from "@/types/cucumber";

const BASE = import.meta.env.VITE_API_BASE_URL ?? "";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) {
    const text = await res.text().catch(() => "");
    throw new Error(`${res.status} ${res.statusText}${text ? ` — ${text}` : ""}`);
  }
  return res.json() as Promise<T>;
}

export function fetchFeatures(): Promise<Feature[]> {
  return request<Feature[]>("/features");
}

interface RunPayload {
  scenarioId: string;
  featureName: string;
  scenarioName: string;
}

interface RunResponse {
  status: "pass" | "fail";
  durationMs: number;
  output: string;
  error?: string;
}

export async function runScenario(
  scenario: Scenario,
  featureName: string,
): Promise<RunResult> {
  const payload: RunPayload = {
    scenarioId: scenarioId(scenario),
    featureName,
    scenarioName: scenario.name,
  };
  const data = await request<RunResponse>("/run", {
    method: "POST",
    body: JSON.stringify(payload),
  });
  return { ...data, ranAt: Date.now() };
}
