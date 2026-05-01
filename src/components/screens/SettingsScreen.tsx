import { useTranslation } from 'react-i18next'
import { type TriggerMode } from '@/lib/api'
import { useSettings } from '@/hooks'
import { Button, Toggle, NumberInput, SectionDivider } from '@/components/ui'
import { FormField } from '@/components/layout'
import { LanguageSelector, ThemeSelector } from '@/components'

export function SettingsScreen() {
    const { t } = useTranslation()
    const { settings, patch, saving, handleSave } = useSettings()

    return (
        <div className="flex flex-col gap-6 p-4 h-full overflow-y-auto">
            <h2 className="text-sm font-semibold text-text">{t('settings.title')}</h2>

            <section className="flex flex-col gap-3">
                <SectionDivider title={t('settings.sections.monitoring')} />

                <FormField label={t('settings.poll_interval_label')}>
                    <NumberInput
                        value={settings.poll_interval_secs}
                        onChange={(v) => patch('poll_interval_secs', v || 1)}
                        min={0.25}
                        step={0.25}
                        className="w-24"
                    />
                </FormField>

                <div className="flex flex-col gap-1.5">
                    <label className="text-xs font-medium text-text-secondary">
                        {t('settings.trigger_label')}
                    </label>
                    <div className="flex gap-2">
                        {(['ui', 'race'] as TriggerMode[]).map((mode) => (
                            <button
                                key={mode}
                                onClick={() => patch('default_trigger', mode)}
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
                    <p className="text-xs text-text-muted">{t('settings.trigger_hint')}</p>
                </div>
            </section>

            <section className="flex flex-col gap-3">
                <SectionDivider title={t('settings.sections.system')} />

                <ToggleRow
                    label={t('settings.autostart_label')}
                    description={t('settings.autostart_hint')}
                    enabled={settings.autostart}
                    onChange={(v) => patch('autostart', v)}
                />
                <ToggleRow
                    label={t('settings.notifications_label')}
                    description={t('settings.notifications_hint')}
                    enabled={settings.notifications_enabled}
                    onChange={(v) => patch('notifications_enabled', v)}
                />
                <SettingRow label={t('settings.language_label')}>
                    <LanguageSelector variant="default" />
                </SettingRow>
                <SettingRow label={t('settings.theme_label')}>
                    <ThemeSelector variant="default" />
                </SettingRow>
            </section>

            <div className="flex justify-end pt-2">
                <Button onClick={handleSave} disabled={saving}>
                    {saving ? '…' : t('settings.save')}
                </Button>
            </div>
        </div>
    )
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-text-secondary">{label}</p>
            {children}
        </div>
    )
}

function ToggleRow({
    label,
    description,
    enabled,
    onChange,
}: {
    label: string
    description: string
    enabled: boolean
    onChange: (v: boolean) => void
}) {
    return (
        <div className="flex items-center justify-between">
            <div>
                <p className="text-xs font-medium text-text-secondary">{label}</p>
                <p className="text-xs text-text-muted">{description}</p>
            </div>
            <Toggle checked={enabled} onChange={onChange} label={label} />
        </div>
    )
}
