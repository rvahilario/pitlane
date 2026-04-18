import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/LanguageSelector";
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
                className="px-3 py-1.5 text-xs rounded border transition-colors
                           data-[active=true]:bg-accent/15 data-[active=true]:border-accent/40 data-[active=true]:text-accent
                           data-[active=false]:border-border-strong data-[active=false]:text-text-muted
                           data-[active=false]:hover:border-elevated data-[active=false]:hover:text-text-secondary"
                data-active={settings.default_trigger === mode}
              >
                {t(`settings.trigger_${mode}`)}
              </button>
            ))}
          </div>
          <p className="text-xs text-text-disabled">{t("settings.trigger_hint")}</p>
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
      </section>

      <div className="flex justify-end pt-2">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-1.5 text-xs font-semibold rounded bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 transition-colors disabled:opacity-50"
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
        <p className="text-xs text-text-disabled">{description}</p>
      </div>
      <button
        onClick={() => onChange(!enabled)}
        className={`w-10 h-5 rounded-full relative transition-colors ${enabled ? "bg-accent/30 border border-accent/50" : "bg-elevated border border-border-strong"}`}
      >
        <span
          className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform ${enabled ? "translate-x-5 bg-accent" : "translate-x-0.5 bg-text-muted"}`}
        />
      </button>
    </div>
  );
}
