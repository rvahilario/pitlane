import { useEffect, useState } from "react";
import { Plus, Play, Square, LayoutList } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import { api, type ManagedApp, type Profile } from "@/lib/api";

export function AppsScreen() {
  const { t } = useTranslation();
  const [apps, setApps] = useState<ManagedApp[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);

  useEffect(() => {
    Promise.all([api.getApps(), api.getProfiles(), api.getActiveProfileId()]).then(
      ([loadedApps, profiles, activeId]) => {
        setApps(loadedApps);
        setActiveProfile(profiles.find((p) => p.id === activeId) ?? null);
      },
    );
  }, []);

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text">{t("apps.title")}</h2>
          <p className="text-xs text-text-muted mt-0.5">
            {t("apps.profile_label", { name: activeProfile?.name ?? "…" })}
          </p>
        </div>
        <button className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 transition-colors">
          <Plus className="w-3.5 h-3.5" />
          {t("apps.add")}
        </button>
      </div>

      {apps.length === 0 ? (
        <div className="flex-1 flex flex-col items-center justify-center text-text-disabled gap-2">
          <LayoutList className="w-8 h-8" />
          <p className="text-sm">{t("apps.empty")}</p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {apps.map((app) => (
            <li
              key={app.id}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg border bg-surface transition-all",
                "border-border-strong",
                !app.enabled && "opacity-40",
              )}
            >
              <div className="w-2 h-2 rounded-full shrink-0 bg-elevated" />

              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-text truncate">{app.name}</p>
                <p className="text-xs text-text-muted truncate font-mono">{app.exe_path}</p>
              </div>

              <button
                title={t("apps.start")}
                className="p-1.5 rounded transition-colors text-text-muted hover:text-text-secondary hover:bg-elevated"
              >
                <Play className="w-3.5 h-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
