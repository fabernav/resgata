import { CheckCheck, CheckCircle2, Clock, Lock, ShieldCheck, Sparkles } from "lucide-react";
import type { ComponentType } from "react";

type StatusStyle = {
  label: string;
  icon: ComponentType<{ className?: string }>;
  className: string;
};

const STATUS_STYLES: Record<string, StatusStyle> = {
  PENDING_MATCH: {
    label: "Aguardando match",
    icon: Clock,
    className: "bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/30",
  },
  AVAILABLE: {
    label: "Disponivel",
    icon: CheckCircle2,
    className: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/30",
  },
  MATCHED: {
    label: "Match encontrado",
    icon: Sparkles,
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  SUGGESTED: {
    label: "Sugerido",
    icon: Sparkles,
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/30",
  },
  VERIFIED: {
    label: "Verificado",
    icon: ShieldCheck,
    className: "bg-violet-500/10 text-violet-600 dark:text-violet-400 border-violet-500/30",
  },
  BLOCKED: {
    label: "Bloqueado",
    icon: Lock,
    className: "bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/30",
  },
  RESOLVED: {
    label: "Resolvido",
    icon: CheckCheck,
    className: "bg-surface-muted text-muted border-subtle",
  },
};

export function StatusBadge({ status }: { status: string }) {
  const style = STATUS_STYLES[status] ?? {
    label: status,
    icon: Clock,
    className: "bg-surface-muted text-muted border-subtle",
  };
  const Icon = style.icon;

  return (
    <span className={`pill ${style.className}`}>
      <Icon className="h-3.5 w-3.5" />
      {style.label}
    </span>
  );
}
