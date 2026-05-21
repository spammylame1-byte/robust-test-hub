import { create } from "zustand";
import type { RunResult, Scenario } from "@/types/cucumber";
import { scenarioId } from "@/types/cucumber";
import { runScenario } from "@/lib/api";

interface RunsState {
  results: Record<string, RunResult>;
  run: (scenario: Scenario, featureName: string) => Promise<void>;
}

export const useRunsStore = create<RunsState>((set) => ({
  results: {},
  run: async (scenario, featureName) => {
    const id = scenarioId(scenario);
    set((s) => ({ results: { ...s.results, [id]: { status: "running" } } }));
    try {
      const result = await runScenario(scenario, featureName);
      set((s) => ({ results: { ...s.results, [id]: result } }));
    } catch (err) {
      set((s) => ({
        results: {
          ...s.results,
          [id]: {
            status: "fail",
            error: err instanceof Error ? err.message : String(err),
            ranAt: Date.now(),
          },
        },
      }));
    }
  },
}));
