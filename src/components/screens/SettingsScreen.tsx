import { useTranslation } from "react-i18next";
import { LanguageSelector } from "@/components/LanguageSelector";

export function SettingsScreen() {
  const { t } = useTranslation();

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
            defaultValue={1}
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
            {(["ui", "race"] as const).map((mode) => (
              <button
                key={mode}
                className="px-3 py-1.5 text-xs rounded border transition-colors
                           data-[active=true]:bg-accent/15 data-[active=true]:border-accent/40 data-[active=true]:text-accent
                           data-[active=false]:border-border-strong data-[active=false]:text-text-muted
                           data-[active=false]:hover:border-elevated data-[active=false]:hover:text-text-secondary"
                data-active={mode === "ui"}
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
          enabled={false}
        />
        <ToggleRow
          label={t("settings.notifications_label")}
          description={t("settings.notifications_hint")}
          enabled={true}
        />

        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-text-secondary">{t("settings.language_label")}</p>
          </div>
          <LanguageSelector variant="default" />
        </div>
      </section>

      <div className="flex justify-end pt-2">
        <button className="px-4 py-1.5 text-xs font-semibold rounded bg-accent/15 hover:bg-accent/25 text-accent border border-accent/30 transition-colors">
          {t("settings.save")}
        </button>
      </div>
    </div>
  );
}

function ToggleRow({ label, description, enabled }: { label: string; description: string; enabled: boolean }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-medium text-text-secondary">{label}</p>
        <p className="text-xs text-text-disabled">{description}</p>
      </div>
      <div className={`w-10 h-5 rounded-full relative transition-colors ${enabled ? "bg-accent/30 border border-accent/50" : "bg-elevated border border-border-strong"}`}>
        <span className={`absolute top-0.5 w-4 h-4 rounded-full transition-transform ${enabled ? "translate-x-5 bg-accent" : "translate-x-0.5 bg-text-muted"}`} />
      </div>
    </div>
  );
}
