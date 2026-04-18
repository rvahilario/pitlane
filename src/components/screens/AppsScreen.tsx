import { Plus, Play, Square, LayoutList } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";

interface MockApp {
  id: string;
  name: string;
  exe: string;
  enabled: boolean;
  running: boolean;
}

const MOCK_APPS: MockApp[] = [
  { id: "1", name: "SimHub",      exe: "SimHub.exe",      enabled: true,  running: true  },
  { id: "2", name: "CrewChief",   exe: "CrewChiefV4.exe", enabled: true,  running: false },
  { id: "3", name: "VoiceAttack", exe: "VoiceAttack.exe", enabled: false, running: false },
];

export function AppsScreen() {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text">{t("apps.title")}</h2>
          <p className="text-xs text-text-muted mt-0.5">{t("apps.profile_label", { name: "Default" })}</p>
        </div>
        <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 transition-colors">
          <Plus className="w-3.5 h-3.5" />
          {t("apps.add")}
        </button>
      </div>

      {MOCK_APPS.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-text-disabled gap-2">
          <LayoutList className="w-8 h-8" />
          <p className="text-sm">{t("apps.empty")}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {MOCK_APPS.map((app) => (
            <li
              key={app.id}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-surface transition-all",
                app.running
                  ? "border-accent/40 shadow-[0_0_0_1px_rgba(110,196,192,0.1)]"
                  : "border-border-strong",
                !app.enabled && "opacity-40",
              )}
            >
              <div className={cn(
                "w-2 h-2 rounded-full shrink-0 transition-colors",
                app.running ? "bg-accent" : "bg-elevated",
              )} />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">{app.name}</p>
                <p className="text-xs text-text-muted truncate font-mono">{app.exe}</p>
              </div>

              <button
                title={app.running ? t("apps.stop") : t("apps.start")}
                className={cn(
                  "p-1.5 rounded transition-colors",
                  app.running
                    ? "text-accent hover:bg-accent/10"
                    : "text-text-muted hover:text-text-secondary hover:bg-elevated",
                )}
              >
                {app.running ? <Square className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
