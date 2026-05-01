import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/cn";
import { LanguageSelector } from "@/components/LanguageSelector";
import { ThemeSelector } from "@/components/ThemeSelector";
import { api, type Settings, type TriggerMode } from "@/lib/api";

const DEFAULT_SETTINGS: Settings = {
  poll_interval_secs: 1,
  default_trigger: "ui",
  notifications_enabled: true,
  autostart: false,
};

export function SettingsScreen() {
  const { t } = useTranslation();
  const [settings, setSettings] = useState<Settings>(DEFAULT_SETTINGS);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.getSettings().then(setSettings);
  }, []);

  function patch<K extends keyof Settings>(key: K, value: Settings[K]) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSave() {
    setSaving(true);
    try {
      await api.saveSettings(settings);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="flex flex-col gap-6 p-4 h-full overflow-y-auto">
      <h2 className="text-sm font-semibold text-text">{t("settings.title")}</h2>

      <section className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          {t("settings.sections.monitoring")}
        </h3>

        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-text-secondary">
            {t("settings.poll_interval_label")}
          </label>
          <input
            type="number"
            value={settings.poll_interval_secs}
            onChange={(e) => patch("poll_interval_secs", parseFloat(e.target.value) || 1)}
            min={0.25}
            step={0.25}
            className="w-24 px-2 py-1.5 text-sm bg-surface border border-border-strong rounded text-text font-mono
                       focus:outline-none focus:border-accent/60 focus:ring-1 focus:ring-accent/20 transition-colors"
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs font-medium text-text-secondary">
            {t("settings.trigger_label")}
          </label>
          <div className="flex gap-2">
            {(["ui", "race"] as TriggerMode[]).map((mode) => (
              <button
                key={mode}
                onClick={() => patch("default_trigger", mode)}
                className="px-3 py-1.5 text-sm rounded border transition-colors
                           data-[active=true]:bg-accent-solid data-[active=true]:border-accent-solid data-[active=true]:text-on-accent
                           data-[active=false]:border-border-strong data-[active=false]:text-text-muted
                           data-[active=false]:hover:border-elevated data-[active=false]:hover:text-text-secondary"
                data-active={settings.default_trigger === mode}
              >
                {t(`settings.trigger_${mode}`)}
              </button>
            ))}
          </div>
          <p className="text-xs text-text-muted">{t("settings.trigger_hint")}</p>
        </div>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-xs font-semibold text-text-muted uppercase tracking-wider">
          {t("settings.sections.system")}
        </h3>

        <ToggleRow
          label={t("settings.autostart_label")}
          description={t("settings.autostart_hint")}
          enabled={settings.autostart}
          onChange={(v) => patch("autostart", v)}
        />
        <ToggleRow
          label={t("settings.notifications_label")}
          description={t("settings.notifications_hint")}
          enabled={settings.notifications_enabled}
          onChange={(v) => patch("notifications_enabled", v)}
        />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-text-secondary">{t("settings.language_label")}</p>
          </div>
          <LanguageSelector variant="default" />
        </div>

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-text-secondary">{t("settings.theme_label")}</p>
          </div>
          <ThemeSelector variant="default" />
        </div>
      </section>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 text-sm font-semibold rounded bg-accent-solid hover:bg-accent-solid-hover text-on-accent border border-accent-solid transition-colors disabled:opacity-50"
        >
          {saving ? "…" : t("settings.save")}
        </button>
      </div>
    </div>
  );
}

function ToggleRow({
  label,
  description,
  enabled,
  onChange,
}: {
  label: string;
  description: string;
  enabled: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-text-secondary">{label}</p>
        <p className="text-xs text-text-muted">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={enabled}
        onClick={() => onChange(!enabled)}
        className={cn(
          "flex h-5 w-10 items-center rounded-full p-0.5 transition-colors shrink-0",
          enabled ? "bg-accent-solid hover:bg-accent-solid-hover" : "bg-elevated border border-accent-solid hover:bg-surface",
        )}
      >
        <span
          className={cn(
            "h-4 w-4 rounded-full transition-transform",
            enabled ? "translate-x-5 bg-on-accent" : "translate-x-0 bg-accent-solid",
          )}
        />
      </button>
    </div>
  );
}
