import { useEffect, useRef } from 'react'
import { ScrollText } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { useLog } from '@/hooks'
import type { LogKind } from '@/lib/api'
import { formatLogMessage } from '@/lib/command-center'
import { ScreenHeader } from '@/components/layout'
import { EmptyState } from '@/components/ui'

const kindStyle: Record<LogKind, string> = {
    launch: 'text-success',
    stop: 'text-warning',
    crashed: 'text-danger',
    restarted: 'text-warning',
    iracing_start: 'text-accent',
    iracing_stop: 'text-accent/75',
}

const kindLabel: Record<LogKind, string> = {
    launch: 'STARTED',
    stop: 'STOPPED',
    crashed: 'CRASHED',
    restarted: 'RESTART',
    iracing_start: 'iRACING ▶',
    iracing_stop: 'iRACING ■',
}

function formatTime(ms: number): string {
    const d = new Date(ms)
    return [d.getHours(), d.getMinutes(), d.getSeconds()]
        .map((n) => n.toString().padStart(2, '0'))
        .join(':')
}

export function LogScreen() {
    const { t } = useTranslation()
    const entries = useLog()
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [entries.length])

    return (
        <div className="flex flex-col h-full">
            <ScreenHeader title={t('log.title')} />

            <div className="flex-1 overflow-y-auto p-3 font-mono text-xs flex flex-col gap-0.5">
                {entries.length === 0 ? (
                    <EmptyState icon={ScrollText} message={t('log.empty')} />
                ) : (
                    <div className="grid grid-cols-[4rem_5.5rem_7.5rem_1fr] gap-2">
                        {entries.map((entry) => (
                            <div
                                key={entry.seq}
                                className={cn(
                                    'col-span-4 grid grid-cols-subgrid items-start py-0.5 px-1 rounded',
                                    (entry.kind === 'iracing_start' || entry.kind === 'iracing_stop') &&
                                        'bg-accent/5',
                                )}
                            >
                                <span className="text-text-muted">
                                    {formatTime(entry.timestamp_ms)}
                                </span>
                                <span className={cn('font-semibold', kindStyle[entry.kind])}>
                                    {kindLabel[entry.kind]}
                                </span>
                                <span className="text-text-secondary truncate">
                                    {entry.app ?? ''}
                                </span>
                                <span className={cn('truncate', kindStyle[entry.kind])}>
                                    {formatLogMessage(entry)}
                                </span>
                            </div>
                        ))}
                    </div>
                )}
                <div ref={bottomRef} />
            </div>
        </div>
    )
}
