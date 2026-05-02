import {
    Activity,
    AlertTriangle,
    Ban,
    Clock,
    MoreHorizontal,
    Play,
    RotateCw,
    Square,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import type { AppStatus, ManagedApp } from '@/lib/api'
import { AppAvatar } from '@/components/AppAvatar'
import { Button } from './Button'
import { IconButton } from './IconButton'
import { Toggle } from './Toggle'

interface StatusConfig {
    icon: React.ElementType
    label: string
    colorClass: string
}

function statusConfig(
    app: ManagedApp,
    status: AppStatus | undefined,
    labels: Record<'disabled' | 'running' | 'crashed' | 'idle', string>,
): StatusConfig {
    if (!app.enabled) return { icon: Ban, label: labels.disabled, colorClass: 'text-text-muted' }
    if (status?.state.type === 'running')
        return { icon: Activity, label: labels.running, colorClass: 'text-success' }
    if (status?.state.type === 'crashed')
        return { icon: AlertTriangle, label: labels.crashed, colorClass: 'text-danger' }
    return { icon: Clock, label: labels.idle, colorClass: 'text-text-muted' }
}

interface AppCommandRowProps extends React.HTMLAttributes<HTMLDivElement> {
    app: ManagedApp
    status?: AppStatus
    iconUrl?: string
    onStart: () => void
    onStop: () => void
    onToggleAutoLaunch: (enabled: boolean) => void
    onToggleAutoStop: (enabled: boolean) => void
    onOpenMenu?: () => void
}

export function AppCommandRow({
    app,
    status,
    iconUrl,
    onStart,
    onStop,
    onToggleAutoLaunch,
    onToggleAutoStop,
    onOpenMenu,
    className,
    ...props
}: AppCommandRowProps) {
    const { t } = useTranslation()
    const running = status?.state.type === 'running'
    const crashed = status?.state.type === 'crashed'
    const {
        icon: StatusIcon,
        label: statusLabel,
        colorClass,
    } = statusConfig(app, status, {
        disabled: t('apps.status.disabled'),
        running: t('apps.status.running'),
        crashed: t('apps.status.crashed'),
        idle: t('apps.status.idle'),
    })

    return (
        <div
            className={cn(
                'grid h-app-row grid-cols-[minmax(18rem,1fr)_18rem_12rem_var(--spacing-app-action)_var(--spacing-app-menu)] items-center gap-4 border-b border-border px-4 last:border-b-0',
                className,
            )}
            {...props}
        >
            {/* Identity */}
            <div className="flex min-w-0 items-center gap-3">
                <AppAvatar
                    name={app.name}
                    iconUrl={iconUrl}
                    className="h-app-avatar w-app-avatar shrink-0 rounded-xl text-base font-bold"
                />
                <div className="min-w-0">
                    <p className="truncate text-row-title font-semibold text-text">{app.name}</p>
                    <p className="mt-1 truncate text-body-ui text-text-muted">v--</p>
                </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
                <StatusIcon
                    className={cn('h-4 w-4 shrink-0 stroke-[2.5]', colorClass)}
                    aria-hidden="true"
                />
                <span className={cn('text-body-ui font-medium', colorClass)}>{statusLabel}</span>
            </div>

            {/* Toggles */}
            <div className="flex flex-col gap-2 text-body-ui text-text-secondary">
                <div className="flex items-center justify-between gap-3">
                    <span>{t('command.auto_launch')}</span>
                    <Toggle
                        checked={app.enabled}
                        onChange={onToggleAutoLaunch}
                        label={`${app.name} auto-launch`}
                    />
                </div>
                <div className="flex items-center justify-between gap-3">
                    <span>{t('command.auto_stop')}</span>
                    <Toggle
                        checked={app.stop_with_iracing}
                        disabled={!app.enabled}
                        onChange={onToggleAutoStop}
                        label={`${app.name} auto-stop`}
                    />
                </div>
            </div>

            {/* Action */}
            {running ? (
                <Button variant="ghost" size="md" onClick={onStop} className="w-full gap-2">
                    <Square className="h-3 w-3 shrink-0 fill-current stroke-0" aria-hidden="true" />
                    {t('apps.stop')}
                </Button>
            ) : crashed ? (
                <Button variant="danger" size="md" onClick={onStart} className="w-full gap-2">
                    <RotateCw className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" aria-hidden="true" />
                    {t('command.restart')}
                </Button>
            ) : (
                <Button
                    variant="success"
                    size="md"
                    onClick={onStart}
                    disabled={!app.enabled}
                    className="w-full gap-2"
                >
                    <Play className="h-3 w-3 shrink-0 fill-current stroke-0" aria-hidden="true" />
                    {t('apps.start')}
                </Button>
            )}

            {/* Menu */}
            <IconButton aria-label={`${app.name} actions`} variant="secondary" onClick={onOpenMenu}>
                <MoreHorizontal className="h-4 w-4 stroke-[2.5]" />
            </IconButton>
        </div>
    )
}
