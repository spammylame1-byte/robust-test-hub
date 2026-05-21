import { useMemo, useState } from "react";
import type { Feature } from "@/types/cucumber";
import { scenarioId } from "@/types/cucumber";
import { useRunsStore } from "@/store/runs";
import { ScenarioRow } from "./ScenarioRow";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  feature: Feature;
  onSelectScenario: (id: string) => void;
  defaultOpen?: boolean;
}

export function FeatureCard({ feature, onSelectScenario, defaultOpen }: Props) {
  const [open, setOpen] = useState(defaultOpen ?? false);
  const results = useRunsStore((s) => s.results);

  const counts = useMemo(() => {
    let pass = 0, fail = 0, run = 0;
    for (const s of feature.scenarios) {
      const r = results[scenarioId(s)];
      if (!r) continue;
      if (r.status === "pass") pass++;
      else if (r.status === "fail") fail++;
      else if (r.status === "running") run++;
    }
    return { pass, fail, run, total: feature.scenarios.length };
  }, [feature, results]);

  const passPct = counts.total ? (counts.pass / counts.total) * 100 : 0;
  const failPct = counts.total ? (counts.fail / counts.total) * 100 : 0;

  return (
    <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex w-full items-center gap-4 px-4 py-3 text-left transition-colors hover:bg-muted/40"
      >
        <ChevronDown
          className={cn("h-4 w-4 text-muted-foreground transition-transform", open && "rotate-0", !open && "-rotate-90")}
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Feature</span>
            <h3 className="truncate text-base font-semibold text-foreground">{feature.name}</h3>
          </div>
          <div className="mt-1 flex flex-wrap items-center gap-1.5">
            {feature.tags.map((t) => (
              <span key={t} className="rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-[10px] text-secondary-foreground">
                {t}
              </span>
            ))}
            {feature.background.steps.length > 0 && (
              <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                · {feature.background.steps.length} background step{feature.background.steps.length !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        </div>
        <div className="hidden w-56 shrink-0 md:block">
          <div className="flex h-2 overflow-hidden rounded-sm bg-muted">
            <div className="bg-status-pass" style={{ width: `${passPct}%` }} />
            <div className="bg-status-fail" style={{ width: `${failPct}%` }} />
          </div>
          <div className="mt-1 flex justify-between font-mono text-[10px] text-muted-foreground tabular-nums">
            <span>{counts.pass} pass</span>
            <span>{counts.fail} fail</span>
            <span>{counts.total} total</span>
          </div>
        </div>
      </button>
      {open && (
        <div className="bg-background/40">
          {feature.scenarios.map((s) => (
            <ScenarioRow
              key={scenarioId(s)}
              scenario={s}
              featureName={feature.name}
              onSelect={() => onSelectScenario(scenarioId(s))}
            />
          ))}
        </div>
      )}
    </div>
  );
}
