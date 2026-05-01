import { useEffect, useState } from 'react'
import { Clock3, LayoutList, Pause, UserRound } from 'lucide-react'
import { StatusPill } from '@/components/ui'

interface BottomStatusBarProps {
    activeProfileName?: string | null
    iRacingRunning: boolean
    managedLabel: string
    paused: boolean
    pausedLabel: string
    profileLabel: string
    sessionLabel: string
}

export function BottomStatusBar({
    activeProfileName,
    iRacingRunning,
    managedLabel,
    paused,
    pausedLabel,
    profileLabel,
    sessionLabel,
}: BottomStatusBarProps) {
    const [time, setTime] = useState(() => formatTime(new Date()))

    useEffect(() => {
        const interval = window.setInterval(() => setTime(formatTime(new Date())), 30_000)
        return () => window.clearInterval(interval)
    }, [])

    return (
        <footer className="flex h-9 shrink-0 items-center justify-between gap-3 border-t border-border bg-base px-3">
            <div className="flex min-w-0 items-center gap-2">
                <StatusPill
                    data-testid="iracing-status"
                    variant={iRacingRunning ? 'online' : 'offline'}
                >
                    {sessionLabel}
                </StatusPill>

                {paused && (
                    <StatusPill variant="warning" icon={Pause}>
                        {pausedLabel}
                    </StatusPill>
                )}
            </div>

            <div className="flex min-w-0 items-center gap-3 text-xs text-text-muted">
                <span className="hidden items-center gap-1.5 sm:inline-flex">
                    <LayoutList className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {managedLabel}
                </span>
                <span className="hidden min-w-0 items-center gap-1.5 md:inline-flex">
                    <UserRound className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    <span className="shrink-0">{profileLabel}</span>
                    <span className="max-w-32 truncate text-text-secondary">
                        {activeProfileName ?? '...'}
                    </span>
                </span>
                <span
                    className="inline-flex items-center gap-1.5 font-mono text-text-secondary"
                    aria-label={time}
                >
                    <Clock3 className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
                    {time}
                </span>
            </div>
        </footer>
    )
}

function formatTime(date: Date): string {
    return [date.getHours(), date.getMinutes()]
        .map((part) => String(part).padStart(2, '0'))
        .join(':')
}
