import { Circle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import { LanguageSelector } from "@/components/LanguageSelector";
import { PitlaneLogo } from "@/components/PitlaneLogo";
import { ThemeSelector } from "@/components/ThemeSelector";

interface StatusBarProps {
  iRacingRunning: boolean;
  sessionType: "race" | "service" | null;
  managedCount: number;
  paused: boolean;
}

export function StatusBar({ iRacingRunning, sessionType, managedCount, paused }: StatusBarProps) {
  const { t } = useTranslation();

  const sessionLabel = iRacingRunning
    ? sessionType === "race" ? t("status.racing") : t("status.iracing_open")
    : t("status.iracing_offline");

  return (
    <header className="flex items-center justify-between px-4 h-11 bg-canvas border-b border-border shrink-0">
      <PitlaneLogo />

      <div className="flex items-center gap-3">
        {paused && (
          <span className="text-xs text-warning font-medium tracking-wide">
            {t("status.paused")}
          </span>
        )}

        {iRacingRunning && managedCount > 0 && (
          <span className="text-xs text-text-muted">
            {t("status.apps_running", { count: managedCount })}
          </span>
        )}

        <div
          data-testid="iracing-status"
          className={cn(
            "flex items-center gap-2 px-2.5 py-1 rounded-full text-xs font-medium transition-colors",
            iRacingRunning
              ? "bg-accent/10 border border-accent/25 text-accent"
              : "bg-surface border border-border-strong text-text-muted",
          )}
        >
          <Circle className={cn(
            "w-1.5 h-1.5 fill-current shrink-0",
            iRacingRunning ? "text-accent" : "text-text-disabled",
          )} />
          {sessionLabel}
        </div>

        <div className="w-px h-4 bg-border" />

        <ThemeSelector variant="compact" />
        <LanguageSelector variant="compact" />
      </div>
    </header>
  );
}
