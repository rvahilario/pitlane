import { useEffect, useState } from "react";
import { Plus, Play, LayoutList, X } from "lucide-react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import { api, type ManagedApp, type Profile } from "@/lib/api";

function AddAppModal({ onClose, onAdded }: { onClose: () => void; onAdded: (app: ManagedApp) => void }) {
  const { t } = useTranslation();
  const [name, setName] = useState("");
  const [exePath, setExePath] = useState("");
  const [saving, setSaving] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      const app = await api.addApp({ name, exe_path: exePath });
      onAdded(app);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div role="dialog" aria-modal="true" className="fixed inset-0 z-50 flex items-center justify-center bg-black/60">
      <div className="bg-surface border border-border-strong rounded-xl w-full max-w-md p-5 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-text">{t("apps.add_modal_title")}</h3>
          <button
            onClick={onClose}
            className="p-1 rounded text-text-muted hover:text-text transition-colors"
            aria-label="close"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <div className="flex flex-col gap-1">
            <label htmlFor="app-name" className="text-xs text-text-muted">
              {t("apps.add_modal_name")}
            </label>
            <input
              id="app-name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="text-sm bg-elevated border border-border-strong rounded-md px-3 py-1.5 text-text outline-none focus:border-accent"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="app-exe" className="text-xs text-text-muted">
              {t("apps.add_modal_exe")}
            </label>
            <input
              id="app-exe"
              type="text"
              required
              value={exePath}
              onChange={(e) => setExePath(e.target.value)}
              className="text-sm bg-elevated border border-border-strong rounded-md px-3 py-1.5 text-text font-mono outline-none focus:border-accent"
            />
          </div>

          <div className="flex justify-end gap-2 mt-1">
            <button
              type="button"
              onClick={onClose}
              className="text-xs px-3 py-1.5 rounded-md border border-border-strong text-text-muted hover:text-text transition-colors"
            >
              {t("apps.add_modal_cancel")}
            </button>
            <button
              type="submit"
              disabled={saving}
              className="text-xs font-semibold px-3 py-1.5 rounded-md bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 transition-colors disabled:opacity-50"
            >
              {saving ? "…" : t("apps.add_modal_confirm")}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AppsScreen() {
  const { t } = useTranslation();
  const [apps, setApps] = useState<ManagedApp[]>([]);
  const [activeProfile, setActiveProfile] = useState<Profile | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  function loadApps() {
    return Promise.all([api.getApps(), api.getProfiles(), api.getActiveProfileId()]).then(
      ([loadedApps, profiles, activeId]) => {
        setApps(loadedApps);
        setActiveProfile(profiles.find((p) => p.id === activeId) ?? null);
      },
    );
  }

  useEffect(() => {
    loadApps();
  }, []);

  function handleAdded(app: ManagedApp) {
    setApps((prev) => [...prev, app]);
    setShowAddModal(false);
    loadApps();
  }

  return (
    <div className="flex flex-col gap-4 p-4 h-full overflow-y-auto">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-text">{t("apps.title")}</h2>
          <p className="text-xs text-text-muted mt-0.5">
            {t("apps.profile_label", { name: activeProfile?.name ?? "…" })}
          </p>
        </div>
        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-md bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 transition-colors"
        >
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

      {showAddModal && (
        <AddAppModal onClose={() => setShowAddModal(false)} onAdded={handleAdded} />
      )}
    </div>
  );
}
