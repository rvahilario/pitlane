import { MoreHorizontal, Play, Square } from 'lucide-react'
import { cn } from '@/lib/cn'
import type { AppStatus, ManagedApp } from '@/lib/api'
import { AppAvatar } from '@/components/AppAvatar'
import { Button } from './Button'
import { IconButton } from './IconButton'
import { StatusPill } from './StatusPill'
import { Toggle } from './Toggle'

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

function statusConfig(app: ManagedApp, status?: AppStatus) {
    if (!app.enabled) return { variant: 'disabled' as const, label: 'Disabled' }
    if (status?.state.type === 'running') return { variant: 'running' as const, label: 'Running' }
    if (status?.state.type === 'crashed') return { variant: 'crashed' as const, label: 'Crashed' }
    return { variant: 'idle' as const, label: 'Idle' }
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
    const { variant, label } = statusConfig(app, status)

    return (
        <div
            className={cn(
                'grid min-h-20 grid-cols-[minmax(12rem,1fr)_9rem_11rem_9rem_3rem] items-center gap-4 border-b border-border px-4 py-3 last:border-b-0',
                className,
            )}
            {...props}
        >
            <div className="flex min-w-0 items-center gap-3">
                <AppAvatar name={app.name} iconUrl={iconUrl} />
                <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-text">{app.name}</p>
                    <p className="truncate text-xs text-text-muted">{app.exe_path}</p>
                </div>
            </div>

            <StatusPill variant={variant}>{label}</StatusPill>

            <div className="grid gap-1 text-xs text-text-muted">
                <div className="flex items-center justify-between gap-2">
                    <span>Auto-launch</span>
                    <Toggle
                        checked={app.enabled}
                        onChange={onToggleAutoLaunch}
                        label={`${app.name} auto-launch`}
                    />
                </div>
                <div className="flex items-center justify-between gap-2">
                    <span>Auto-stop</span>
                    <Toggle
                        checked={app.stop_with_iracing}
                        disabled={!app.enabled}
                        onChange={onToggleAutoStop}
                        label={`${app.name} auto-stop`}
                    />
                </div>
            </div>

            {running ? (
                <Button variant="danger" onClick={onStop}>
                    <Square className="h-3.5 w-3.5 fill-current stroke-[2.5]" />
                    Stop
                </Button>
            ) : (
                <Button variant="success" onClick={onStart} disabled={!app.enabled}>
                    <Play className="h-3.5 w-3.5 fill-current stroke-[2.5]" />
                    Start
                </Button>
            )}

            <IconButton aria-label={`${app.name} actions`} variant="secondary" onClick={onOpenMenu}>
                <MoreHorizontal className="h-4 w-4 stroke-[2.5]" />
            </IconButton>
        </div>
    )
}
