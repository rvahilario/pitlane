import { Activity, AlertTriangle, Ban, Clock3 } from "lucide-react";
import type { AppStatus } from "@/lib/api";

type StatusVariant = "running" | "crashed" | "idle" | "disabled";

const CONFIG: Record<StatusVariant, {
  icon: React.ElementType;
  colorClass: string;
}> = {
  running:  { icon: Activity,       colorClass: "border-success text-success" },
  crashed:  { icon: AlertTriangle,  colorClass: "border-warning text-warning" },
  idle:     { icon: Clock3,         colorClass: "border-border-strong text-text-secondary" },
  disabled: { icon: Ban,            colorClass: "border-border-strong text-text-muted" },
};

interface StatusBadgeProps {
  status: AppStatus | undefined;
  enabled: boolean;
  label: string;
}

export function StatusBadge({ status, enabled, label }: StatusBadgeProps) {
  const variant: StatusVariant = !enabled
    ? "disabled"
    : (status?.state.type ?? "idle") as StatusVariant;

  const { icon: Icon, colorClass } = CONFIG[variant];

  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded border bg-elevated px-1.5 py-0.5 text-[11px] font-medium ${colorClass}`}
    >
      <Icon className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" />
      {label}
    </span>
  );
}

interface TagProps {
  children: React.ReactNode;
}

export function Tag({ children }: TagProps) {
  return (
    <span className="text-xs px-1.5 py-0.5 rounded bg-elevated text-text-secondary">
      {children}
    </span>
  );
}
