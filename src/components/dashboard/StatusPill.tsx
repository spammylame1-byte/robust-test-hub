import { cn } from "@/lib/utils";
import type { RunStatus } from "@/types/cucumber";
import { Loader2 } from "lucide-react";

const LABEL: Record<RunStatus, string> = {
  idle: "Not run",
  running: "Running",
  pass: "Passed",
  fail: "Failed",
};

export function StatusPill({ status, className }: { status: RunStatus; className?: string }) {
  const styles: Record<RunStatus, string> = {
    idle: "bg-status-pending text-status-pending-foreground",
    running: "bg-status-running text-status-running-foreground",
    pass: "bg-status-pass text-status-pass-foreground",
    fail: "bg-status-fail text-status-fail-foreground",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-sm border border-border/40 px-2 py-0.5 font-mono text-[11px] font-semibold uppercase tracking-wider",
        styles[status],
        className,
      )}
    >
      {status === "running" && <Loader2 className="h-3 w-3 animate-spin" />}
      {LABEL[status]}
    </span>
  );
}
