import { create } from "zustand";
import type { RunResult, Scenario } from "@/types/cucumber";
import { scenarioId } from "@/types/cucumber";
import { runScenarioMock } from "@/lib/mock-run";

interface RunsState {
  results: Record<string, RunResult>;
  run: (scenario: Scenario, background: string[]) => Promise<void>;
}

export const useRunsStore = create<RunsState>((set) => ({
  results: {},
  run: async (scenario, background) => {
    const id = scenarioId(scenario);
    set((s) => ({ results: { ...s.results, [id]: { status: "running" } } }));
    const result = await runScenarioMock(scenario, background);
    set((s) => ({ results: { ...s.results, [id]: result } }));
  },
}));
