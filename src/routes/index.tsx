import { createFileRoute, useNavigate, useSearch } from "@tanstack/react-router";
import { useMemo } from "react";
import { queryOptions, useSuspenseQuery, useQueryErrorResetBoundary } from "@tanstack/react-query";
import { useEffect } from "react";
import { useRouter } from "@tanstack/react-router";
import type { Feature } from "@/types/cucumber";
import { scenarioId } from "@/types/cucumber";
import { fetchFeatures } from "@/lib/api";
import { SummaryStats } from "@/components/dashboard/SummaryStats";
import { FeatureCard } from "@/components/dashboard/FeatureCard";
import { ScenarioDetailPanel } from "@/components/dashboard/ScenarioDetailPanel";

interface SearchParams {
  scenario?: string;
}

const featuresQueryOptions = queryOptions({
  queryKey: ["features"],
  queryFn: () => fetchFeatures(),
});

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
  loader: ({ context }) => context.queryClient.ensureQueryData(featuresQueryOptions),
  pendingComponent: () => (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
        Loading features…
      </p>
    </div>
  ),
  errorComponent: ErrorView,
  component: Dashboard,
});

function ErrorView({ error, reset }: { error: Error; reset: () => void }) {
  const router = useRouter();
  const queryErrorReset = useQueryErrorResetBoundary();
  useEffect(() => {
    queryErrorReset.reset();
  }, [queryErrorReset]);
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md space-y-3 rounded-md border border-status-fail/50 bg-status-fail/10 p-5 text-center">
        <h2 className="font-mono text-xs uppercase tracking-widest text-status-fail">
          Failed to load features
        </h2>
        <p className="font-mono text-xs text-foreground">{error.message}</p>
        <button
          onClick={() => {
            reset();
            void router.invalidate();
          }}
          className="rounded-sm bg-primary px-3 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90"
        >
          Retry
        </button>
      </div>
    </div>
  );
}

function Dashboard() {
  const { data } = useSuspenseQuery(featuresQueryOptions);
  const features = data.features;
  const loadError = data.error;
  const { scenario: selectedId } = useSearch({ from: "/" });
  const navigate = useNavigate({ from: "/" });

  const selected = useMemo(() => {
    if (!selectedId) return null;
    for (const f of features) {
      const s = f.scenarios.find((sc) => scenarioId(sc) === selectedId);
      if (s) return { feature: f, scenario: s };
    }
    return null;
  }, [selectedId, features]);

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
        {loadError ? (
          <div className="rounded-md border border-status-fail/50 bg-status-fail/10 p-5">
            <h2 className="font-mono text-xs uppercase tracking-widest text-status-fail">
              No features loaded
            </h2>
            <p className="mt-2 font-mono text-xs text-foreground">{loadError}</p>
          </div>
        ) : (
          <>
            <SummaryStats features={features as Feature[]} />
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
          </>
        )}
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
