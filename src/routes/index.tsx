import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo } from "react";
import featuresData from "@/data/features.json";
import type { Feature } from "@/types/cucumber";
import { scenarioId } from "@/types/cucumber";
import { SummaryStats } from "@/components/dashboard/SummaryStats";
import { FeatureCard } from "@/components/dashboard/FeatureCard";
import { ScenarioDetailPanel } from "@/components/dashboard/ScenarioDetailPanel";

interface SearchParams {
  scenario?: string;
}

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Cucumber Test Dashboard" },
      { name: "description", content: "Run and inspect Cucumber feature tests by feature and scenario." },
    ],
  }),
  validateSearch: (s: Record<string, unknown>): SearchParams => ({
    scenario: typeof s.scenario === "string" ? s.scenario : undefined,
  }),
  component: Dashboard,
});

const features = featuresData as Feature[];

function Dashboard() {
  const { scenario: selectedId } = useSearch({ from: "/" });
  const navigate = useNavigate({ from: "/" });

  const selected = useMemo(() => {
    if (!selectedId) return null;
    for (const f of features) {
      const s = f.scenarios.find((sc) => scenarioId(sc) === selectedId);
      if (s) return { feature: f, scenario: s };
    }
    return null;
  }, [selectedId]);

  const setSelected = (id: string | undefined) => {
    void navigate({ search: { scenario: id } as SearchParams });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-sm bg-primary font-mono text-sm font-bold text-primary-foreground">
              CT
            </div>
            <div>
              <h1 className="text-base font-semibold text-foreground">Cucumber Test Dashboard</h1>
              <p className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
                Feature · Scenario · Run
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl space-y-6 px-6 py-6">
        <SummaryStats features={features} />

        <div>
          <div className="mb-3 flex items-baseline justify-between">
            <h2 className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Features ({features.length})
            </h2>
          </div>
          <div className="space-y-2">
            {features.map((f, i) => (
              <FeatureCard
                key={f.name}
                feature={f}
                defaultOpen={i === 0}
                onSelectScenario={setSelected}
              />
            ))}
          </div>
        </div>
      </main>

      <ScenarioDetailPanel
        feature={selected?.feature ?? null}
        scenario={selected?.scenario ?? null}
        open={!!selected}
        onOpenChange={(o) => {
          if (!o) setSelected(undefined);
        }}
      />
    </div>
  );
}
