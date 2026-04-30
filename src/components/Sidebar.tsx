import { LayoutList, ScrollText, History, Settings } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";

export type Tab = "apps" | "log" | "history" | "settings";

interface SidebarProps {
  active: Tab;
  onChange: (tab: Tab) => void;
}

export function Sidebar({ active, onChange }: SidebarProps) {
  const { t } = useTranslation();

  const items: { id: Tab; label: string; icon: React.ElementType }[] = [
    { id: "apps",     label: t("nav.apps"),     icon: LayoutList },
    { id: "log",      label: t("nav.log"),      icon: ScrollText },
    { id: "history",  label: t("nav.history"),  icon: History },
    { id: "settings", label: t("nav.settings"), icon: Settings },
  ];

  return (
    <nav className="flex flex-col gap-1 w-44 shrink-0 bg-base border-r border-border p-2">
      {items.map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          data-testid={`nav-${id}`}
          onClick={() => onChange(id)}
          className={cn(
            "flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium transition-colors text-left w-full border",
            active === id
              ? "bg-elevated text-text border-accent"
              : "text-text-muted hover:text-text hover:bg-surface border-transparent",
          )}
        >
          <Icon className={cn(
            "w-4 h-4 shrink-0 transition-colors",
            active === id ? "text-accent" : "",
          )} />
          {label}
        </button>
      ))}
    </nav>
  );
}
