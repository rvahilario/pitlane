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
                'col-span-full grid grid-cols-subgrid h-app-row items-stretch border-b border-border last:border-b-0 transition-colors hover:bg-accent-tint',
                className,
            )}
            {...props}
        >
            {/* Identity */}
            <div className="relative flex min-w-0 items-center gap-3 px-4">
                <AppAvatar
                    name={app.name}
                    iconUrl={iconUrl}
                    className="h-app-avatar w-app-avatar shrink-0 rounded-xl text-base font-bold"
                />
                <div className="min-w-0">
                    <p className="truncate text-row-title font-semibold text-text">{app.name}</p>
                </div>
                <span
                    className="pointer-events-none absolute right-0 top-1/2 h-1/2 w-px -translate-y-1/2 bg-border"
                    aria-hidden="true"
                />
            </div>

            {/* Status */}
            <div className="relative flex min-w-0 items-center gap-2 px-6">
                <StatusIcon
                    className={cn('h-4 w-4 shrink-0 stroke-[2.5]', colorClass)}
                    aria-hidden="true"
                />
                <span className={cn('truncate text-body-ui font-medium', colorClass)}>
                    {statusLabel}
                </span>
                <span
                    className="pointer-events-none absolute right-0 top-1/2 h-1/2 w-px -translate-y-1/2 bg-border"
                    aria-hidden="true"
                />
            </div>

            {/* Toggles */}
            <div className="relative grid min-w-0 grid-cols-[auto_auto] content-center items-center gap-x-4 gap-y-1.5 px-6 text-body-ui text-text-secondary">
                <span className="justify-self-end">{t('command.auto_launch')}</span>
                <Toggle
                    checked={app.enabled}
                    onChange={onToggleAutoLaunch}
                    label={`${app.name} auto-launch`}
                />
                <span className="justify-self-end">{t('command.auto_stop')}</span>
                <Toggle
                    checked={app.stop_with_iracing}
                    disabled={!app.enabled}
                    onChange={onToggleAutoStop}
                    label={`${app.name} auto-stop`}
                />
                <span
                    className="pointer-events-none absolute right-0 top-1/2 h-1/2 w-px -translate-y-1/2 bg-border"
                    aria-hidden="true"
                />
            </div>

            {/* Actions */}
            <div className="flex items-center gap-6 px-6">
                {running ? (
                    <Button
                        variant="ghost"
                        size="md"
                        onClick={onStop}
                        className="h-11 min-w-30 gap-2"
                    >
                        <Square className="fill-current stroke-0" aria-hidden="true" />
                        {t('apps.stop')}
                    </Button>
                ) : crashed ? (
                    <Button
                        variant="danger"
                        size="md"
                        onClick={onStart}
                        className="h-11 min-w-30 gap-2"
                    >
                        <RotateCw className="stroke-[2.5]" aria-hidden="true" />
                        {t('command.restart')}
                    </Button>
                ) : (
                    <Button
                        variant="success"
                        size="md"
                        onClick={onStart}
                        disabled={!app.enabled}
                        className="h-11 min-w-30 gap-2"
                    >
                        <Play className="fill-current stroke-0" aria-hidden="true" />
                        {t('apps.start')}
                    </Button>
                )}
                <IconButton
                    aria-label={`${app.name} actions`}
                    variant="secondary"
                    onClick={onOpenMenu}
                >
                    <MoreHorizontal className="stroke-2" />
                </IconButton>
            </div>
        </div>
    )
}
