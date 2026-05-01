import { useEffect, useState } from 'react'
import { Pencil, Play, Square, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { api, type AppStatus, type ManagedApp } from '@/lib/api'
import { StatusBadge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Toggle } from '@/components/ui/Toggle'
import { AppAvatar } from '@/components/AppAvatar'

interface AppCardProps {
    app: ManagedApp
    status: AppStatus | undefined
    onStart: () => void
    onStop: () => void
    onEdit: () => void
    onDelete: () => void
    onToggleEnabled: (enabled: boolean) => void
    onToggleStopWithIracing: (stop: boolean) => void
}

function pidDetail(status: AppStatus | undefined): string | null {
    if (status?.state.type !== 'running') return null
    return `PID ${(status.state as { pid: number }).pid}`
}

export function AppCard({
    app,
    status,
    onStart,
    onStop,
    onEdit,
    onDelete,
    onToggleEnabled,
    onToggleStopWithIracing,
}: AppCardProps) {
    const { t } = useTranslation()
    const running = status?.state.type === 'running'
    const detail = pidDetail(status)
    const appDisabled = !app.enabled
    const [iconUrl, setIconUrl] = useState<string | undefined>(undefined)

    useEffect(() => {
        api.extractIcon(app.exe_path).then((b64) => {
            setIconUrl(b64 ? `data:image/png;base64,${b64}` : undefined)
        })
    }, [app.exe_path])

    const statusLabel = !app.enabled
        ? t('apps.status.disabled')
        : t(`apps.status.${status?.state.type ?? 'idle'}`)

    return (
        <li
            data-testid="app-card"
            className={cn(
                'flex flex-col rounded-lg border bg-surface border-border-strong transition-colors',
                appDisabled && 'border-border bg-surface-disabled',
            )}
        >
            {/* Row 1: avatar / name / status / actions */}
            <div className="flex items-center gap-3 px-3 py-2.5">
                <div className={cn(appDisabled && 'opacity-55')}>
                    <AppAvatar name={app.name} iconUrl={iconUrl} />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex flex-col gap-1">
                        <span
                            className={cn(
                                'text-sm font-medium text-text truncate',
                                appDisabled && 'opacity-60',
                            )}
                        >
                            {app.name}
                        </span>
                        <div className="flex items-center gap-2 min-h-5">
                            <StatusBadge
                                status={status}
                                enabled={app.enabled}
                                label={statusLabel}
                            />
                            {detail && (
                                <span
                                    className="text-xs text-text-muted truncate font-mono"
                                    title={detail}
                                >
                                    {detail}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-1 shrink-0">
                    {running ? (
                        <Button variant="danger" onClick={onStop} title={t('apps.stop')}>
                            <Square className="w-3.5 h-3.5 fill-current stroke-[2.5]" />
                            {t('apps.stop')}
                        </Button>
                    ) : (
                        <Button variant="success" onClick={onStart} title={t('apps.start')}>
                            <Play className="w-3.5 h-3.5 fill-current stroke-[2.5]" />
                            {t('apps.start')}
                        </Button>
                    )}

                    <Button variant="icon" onClick={onEdit} title={t('apps.edit')}>
                        <Pencil className="w-4 h-4 stroke-[2.5]" />
                    </Button>

                    <button
                        title={t('apps.delete')}
                        onClick={onDelete}
                        className="p-1.5 rounded text-danger hover:bg-danger/10 transition-colors"
                    >
                        <Trash2 className="w-4 h-4 stroke-[2.5]" />
                    </button>
                </div>
            </div>

            {/* Row 2: auto-start / auto-stop toggles */}
            <div className="flex items-center justify-between px-3 pb-2.5 -mt-0.5 gap-4">
                <div className="flex items-center gap-2">
                    <span className="text-xs text-text-secondary">{t('apps.auto_start')}</span>
                    <Toggle
                        checked={app.enabled}
                        onChange={onToggleEnabled}
                        label={t('apps.auto_start')}
                    />
                </div>
                <div className={cn('flex items-center gap-2', appDisabled && 'opacity-60')}>
                    <span className="text-xs text-text-muted">{t('apps.auto_stop')}</span>
                    <Toggle
                        checked={app.stop_with_iracing}
                        disabled={appDisabled}
                        onChange={onToggleStopWithIracing}
                        label={t('apps.auto_stop')}
                    />
                </div>
            </div>
        </li>
    )
}
