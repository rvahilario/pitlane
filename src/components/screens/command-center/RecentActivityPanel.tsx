import { Clock3, Filter } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { ActivityRow, Button, Panel } from '@/components/ui'
import type { LogEntry } from '@/lib/api'
import { formatTime, KIND_VARIANT } from '@/lib/command-center'

interface RecentActivityPanelProps {
    entries: LogEntry[]
}

export function RecentActivityPanel({ entries }: RecentActivityPanelProps) {
    const { t } = useTranslation()

    return (
        <Panel className="h-activity-panel shrink-0 overflow-hidden">
            <div className="flex h-panel-header items-center justify-between border-b border-border px-6">
                <span className="text-panel-title font-medium uppercase text-text-secondary">
                    {t('command.activity_panel')}
                </span>
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
            {entries.length > 0 ? (
                entries.map((entry) => (
                    <ActivityRow
                        key={entry.seq}
                        time={formatTime(entry.timestamp_ms)}
                        event={t(`command.log_events.${entry.kind}`)}
                        variant={KIND_VARIANT[entry.kind]}
                        source={entry.app ?? undefined}
                        message={entry.msg}
                    />
                ))
            ) : (
                <div className="flex h-24 items-center gap-3 px-6 text-sm text-text-muted">
                    <Clock3 className="h-5 w-5 shrink-0" aria-hidden="true" />
                    {t('log.empty')}
                </div>
            )}
        </Panel>
    )
}
