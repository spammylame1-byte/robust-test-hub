import type { RunResult, Scenario } from "@/types/cucumber";
import { scenarioId } from "@/types/cucumber";
import { getFeatures } from "./features.functions";
import { runScenarioFn } from "./run.functions";

export function fetchFeatures() {
  return getFeatures();
}

export async function runScenario(
  scenario: Scenario,
  featureName: string,
): Promise<RunResult> {
  const data = await runScenarioFn({
    data: {
      scenarioId: scenarioId(scenario),
      featureName,
      scenarioName: scenario.name,
    },
  });
  return { ...data, ranAt: Date.now() };
}
