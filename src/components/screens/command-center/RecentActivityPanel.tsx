import { useState } from 'react'
import { ChevronDown, Clock3, Filter } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ActivityRow, Button, Panel } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { LogEntry } from '@/lib/api'
import { formatTime, formatLogMessage, KIND_VARIANT } from '@/lib/command-center'

interface RecentActivityPanelProps {
    entries: LogEntry[]
}

export function RecentActivityPanel({ entries }: RecentActivityPanelProps) {
    const [open, setOpen] = useState(true)
    const { t } = useTranslation()

    function toggleOpen() {
        setOpen((prev) => !prev)
    }

    return (
        <Panel
            className={cn(
                'flex shrink-0 flex-col overflow-hidden transition-[height] duration-200 ease-in-out',
                open ? 'h-activity-panel' : 'h-panel-header',
            )}
        >
            <div
                className={cn(
                    'flex h-panel-header shrink-0 items-center justify-between px-6',
                    open && 'border-b border-border',
                )}
            >
                <button
                    className="flex items-center gap-2 rounded text-panel-title font-medium uppercase text-text-secondary hover:text-text focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent"
                    onClick={toggleOpen}
                    aria-expanded={open}
                    aria-controls="recent-activity-content"
                >
                    <ChevronDown
                        className={cn(
                            'h-4 w-4 shrink-0 transition-transform duration-200',
                            !open && '-rotate-90',
                        )}
                        aria-hidden="true"
                    />
                    {t('command.activity_panel')}
                </button>
                <div className="flex items-center gap-3">
                    <Button variant="ghost" size="md" disabled>
                        <Filter className="h-4 w-4" aria-hidden="true" />
                        {t('command.filters')}
                    </Button>
                    <Button variant="ghost" size="md" disabled>
                        {t('command.clear_activity')}
                    </Button>
                </div>
            </div>
            <div
                id="recent-activity-content"
                className="flex flex-1 flex-col overflow-y-auto bg-base"
            >
                {entries.length > 0 ? (
                    entries.map((entry) => (
                        <ActivityRow
                            key={entry.seq}
                            time={formatTime(entry.timestamp_ms)}
                            event={t(`command.log_events.${entry.kind}`)}
                            variant={KIND_VARIANT[entry.kind]}
                            source={entry.app ?? undefined}
                            message={formatLogMessage(entry)}
                        />
                    ))
                ) : (
                    <div className="flex flex-1 items-center justify-center gap-3 text-sm text-text-muted">
                        <Clock3 className="h-5 w-5 shrink-0" aria-hidden="true" />
                        {t('log.empty')}
                    </div>
                )}
            </div>
        </Panel>
    )
}
