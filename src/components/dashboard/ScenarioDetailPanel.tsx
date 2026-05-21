import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import type { Feature, Scenario } from "@/types/cucumber";
import { scenarioId } from "@/types/cucumber";
import { useRunsStore } from "@/store/runs";
import { StatusPill } from "./StatusPill";
import { Play, Loader2 } from "lucide-react";

interface Props {
  feature: Feature | null;
  scenario: Scenario | null;
  open: boolean;
  onOpenChange: (o: boolean) => void;
}

export function ScenarioDetailPanel({ feature, scenario, open, onOpenChange }: Props) {
  const id = scenario ? scenarioId(scenario) : "";
  const result = useRunsStore((s) => (id ? s.results[id] : undefined));
  const run = useRunsStore((s) => s.run);
  const status = result?.status ?? "idle";

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full overflow-y-auto p-0 sm:max-w-xl">
        {scenario && feature && (
          <>
            <SheetHeader className="border-b border-border bg-muted/30 p-5">
              <div className="flex items-center gap-2">
                <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
                  {feature.name}
                </span>
              </div>
              <SheetTitle className="text-left text-lg">{scenario.name}</SheetTitle>
              <SheetDescription className="sr-only">Scenario details</SheetDescription>
              <div className="flex flex-wrap items-center gap-2 pt-1">
                <StatusPill status={status} />
                {scenario.tags.map((t) => (
                  <span key={t} className="rounded-sm bg-secondary px-1.5 py-0.5 font-mono text-[11px] text-secondary-foreground">
                    {t}
                  </span>
                ))}
                {result?.durationMs != null && (
                  <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                    {result.durationMs}ms
                  </span>
                )}
              </div>
              <div className="pt-2">
                <Button
                  onClick={() => void run(scenario, feature.name)}
                  disabled={status === "running"}
                  className="gap-2"
                >
                  {status === "running" ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  Run Test
                </Button>
              </div>
            </SheetHeader>

            <div className="space-y-6 p-5">
              <Section title="Steps">
                <div className="overflow-hidden rounded-md border border-border bg-muted/30 font-mono text-xs">
                  {feature.background.steps.map((s, i) => (
                    <div key={`bg-${i}`} className="border-b border-border/60 px-3 py-1.5 text-muted-foreground">
                      <span className="mr-2 text-[10px] uppercase tracking-widest">bg</span>
                      {s}
                    </div>
                  ))}
                  {scenario.steps.map((s, i) => (
                    <div key={i} className="border-b border-border/60 px-3 py-1.5 last:border-b-0">
                      {s}
                    </div>
                  ))}
                </div>
              </Section>

              {result?.error && (
                <Section title="Error">
                  <pre className="overflow-x-auto whitespace-pre-wrap rounded-md border border-status-fail/50 bg-status-fail/10 p-3 font-mono text-xs text-status-fail">
                    {result.error}
                  </pre>
                </Section>
              )}

              <Section title="Output">
                {result?.output ? (
                  <pre className="overflow-x-auto rounded-md border border-border bg-foreground/5 p-3 font-mono text-xs text-foreground">
                    {result.output}
                  </pre>
                ) : (
                  <div className="rounded-md border border-dashed border-border bg-muted/20 p-4 text-center font-mono text-xs text-muted-foreground">
                    No run yet. Click Run Test to execute.
                  </div>
                )}
              </Section>

              {result?.ranAt && (
                <div className="font-mono text-[11px] text-muted-foreground">
                  Last run: {new Date(result.ranAt).toLocaleString()}
                </div>
              )}
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">
        {title}
      </div>
      {children}
    </div>
  );
}
