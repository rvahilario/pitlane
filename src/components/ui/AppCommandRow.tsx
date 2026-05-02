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

function statusConfig(app: ManagedApp, status?: AppStatus): StatusConfig {
    if (!app.enabled)
        return { icon: Ban, label: 'Disabled', colorClass: 'text-text-muted' }
    if (status?.state.type === 'running')
        return { icon: Activity, label: 'Running', colorClass: 'text-success' }
    if (status?.state.type === 'crashed')
        return { icon: AlertTriangle, label: 'Crashed', colorClass: 'text-warning' }
    return { icon: Clock, label: 'Idle', colorClass: 'text-text-muted' }
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
    const running = status?.state.type === 'running'
    const crashed = status?.state.type === 'crashed'
    const { icon: StatusIcon, label: statusLabel, colorClass } = statusConfig(app, status)

    return (
        <div
            className={cn(
                'grid min-h-[4.5rem] grid-cols-[minmax(14rem,1fr)_9rem_12rem_6rem_2.5rem] items-center gap-4 border-b border-border px-4 py-3 last:border-b-0',
                className,
            )}
            {...props}
        >
            {/* Identity */}
            <div className="flex min-w-0 items-center gap-3">
                <AppAvatar
                    name={app.name}
                    iconUrl={iconUrl}
                    className="h-12 w-12 shrink-0 rounded-xl text-sm font-bold"
                />
                <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-text">{app.name}</p>
                    <p className="truncate text-xs text-text-muted">{app.exe_path}</p>
                </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2">
                <StatusIcon
                    className={cn('h-4 w-4 shrink-0 stroke-[2.5]', colorClass)}
                    aria-hidden="true"
                />
                <span className={cn('text-sm font-medium', colorClass)}>{statusLabel}</span>
            </div>

            {/* Toggles */}
            <div className="flex flex-col gap-1.5 text-xs text-text-muted">
                <div className="flex items-center justify-between gap-3">
                    <span>Auto-launch</span>
                    <Toggle
                        checked={app.enabled}
                        onChange={onToggleAutoLaunch}
                        label={`${app.name} auto-launch`}
                    />
                </div>
                <div className="flex items-center justify-between gap-3">
                    <span>Auto-stop</span>
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
                <Button variant="ghost" size="sm" onClick={onStop} className="w-full gap-2">
                    <Square className="h-3 w-3 shrink-0 fill-current stroke-0" aria-hidden="true" />
                    Stop
                </Button>
            ) : crashed ? (
                <Button variant="danger" size="sm" onClick={onStart} className="w-full gap-2">
                    <RotateCw className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" aria-hidden="true" />
                    Restart
                </Button>
            ) : (
                <Button
                    variant="success"
                    size="sm"
                    onClick={onStart}
                    disabled={!app.enabled}
                    className="w-full gap-2"
                >
                    <Play className="h-3 w-3 shrink-0 fill-current stroke-0" aria-hidden="true" />
                    Start
                </Button>
            )}

            {/* Menu */}
            <IconButton
                aria-label={`${app.name} actions`}
                variant="secondary"
                onClick={onOpenMenu}
            >
                <MoreHorizontal className="h-4 w-4 stroke-[2.5]" />
            </IconButton>
        </div>
    )
}
