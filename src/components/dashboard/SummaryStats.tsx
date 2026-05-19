import { useMemo } from "react";
import type { Feature } from "@/types/cucumber";
import { scenarioId } from "@/types/cucumber";
import { useRunsStore } from "@/store/runs";

export function SummaryStats({ features }: { features: Feature[] }) {
  const results = useRunsStore((s) => s.results);

  const stats = useMemo(() => {
    const totalFeatures = features.length;
    const allScenarios = features.flatMap((f) => f.scenarios);
    const totalScenarios = allScenarios.length;
    let passed = 0;
    let failed = 0;
    let running = 0;
    let executed = 0;
    for (const s of allScenarios) {
      const r = results[scenarioId(s)];
      if (!r) continue;
      if (r.status === "running") running++;
      else {
        executed++;
        if (r.status === "pass") passed++;
        if (r.status === "fail") failed++;
      }
    }
    const passRate = executed > 0 ? Math.round((passed / executed) * 100) : 0;
    return { totalFeatures, totalScenarios, executed, passed, failed, running, passRate };
  }, [features, results]);

  const cells = [
    { label: "Features", value: stats.totalFeatures },
    { label: "Scenarios", value: stats.totalScenarios },
    { label: "Executed", value: stats.executed },
    { label: "Passed", value: stats.passed, accent: "text-status-pass" },
    { label: "Failed", value: stats.failed, accent: "text-status-fail" },
    { label: "Running", value: stats.running, accent: "text-status-running" },
    { label: "Pass rate", value: `${stats.passRate}%` },
  ];

  return (
    <div className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-border bg-border sm:grid-cols-4 lg:grid-cols-7">
      {cells.map((c) => (
        <div key={c.label} className="bg-card px-4 py-3">
          <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
            {c.label}
          </div>
          <div className={`mt-1 text-2xl font-semibold tabular-nums ${c.accent ?? "text-foreground"}`}>
            {c.value}
          </div>
        </div>
      ))}
    </div>
  );
}
