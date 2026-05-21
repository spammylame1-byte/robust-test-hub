import { Button } from "@/components/ui/button";
import { useRunsStore } from "@/store/runs";
import type { Scenario } from "@/types/cucumber";
import { scenarioId } from "@/types/cucumber";
import { StatusPill } from "./StatusPill";
import { Play, ChevronRight, Loader2 } from "lucide-react";

interface Props {
  scenario: Scenario;
  featureName: string;
  onSelect: () => void;
}

export function ScenarioRow({ scenario, featureName, onSelect }: Props) {
  const id = scenarioId(scenario);
  const result = useRunsStore((s) => s.results[id]);
  const run = useRunsStore((s) => s.run);
  const status = result?.status ?? "idle";
  const testIdTag = scenario.tags.find((t) => /^@TestID_/i.test(t));

  return (
    <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-2.5 hover:bg-muted/50">
      <div className="flex min-w-0 flex-1 items-center gap-3">
        {testIdTag && (
          <span className="shrink-0 rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-secondary-foreground">
            {testIdTag.replace(/^@/, "")}
          </span>
        )}
        <span className="truncate text-sm font-medium text-foreground">{scenario.name}</span>
        {result?.durationMs != null && (
          <span className="ml-auto shrink-0 font-mono text-[11px] text-muted-foreground tabular-nums">
            {result.durationMs}ms
          </span>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <StatusPill status={status} />
        <Button
          size="sm"
          variant="default"
          disabled={status === "running"}
          onClick={(e) => {
            e.stopPropagation();
            void run(scenario, featureName);
          }}
          className="h-7 gap-1 px-2"
        >
          {status === "running" ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin" />
          ) : (
            <Play className="h-3.5 w-3.5" />
          )}
          Run
        </Button>
        <Button size="sm" variant="outline" onClick={onSelect} className="h-7 gap-1 px-2">
          Details
          <ChevronRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}
