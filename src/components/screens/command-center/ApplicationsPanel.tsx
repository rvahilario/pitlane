import { LayoutList, Play, Plus, Square } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AppCommandRow, Button, EmptyState, Panel, Toggle } from '@/components/ui'
import type { AppStatus, ManagedApp } from '@/lib/api'
import type { AppSummary } from '@/lib/command-center'

interface ApplicationsPanelProps {
    apps: ManagedApp[]
    iconUrls: Record<string, string | undefined>
    onNavigateToApps?: () => void
    onStartAll: () => void
    onStartApp: (app: ManagedApp) => void
    onStopAll: () => void
    onStopApp: (app: ManagedApp) => void
    onOpenAppActions?: (app: ManagedApp) => void
    onTogglePreventAutoStop: () => void
    onToggleAutoLaunch: (app: ManagedApp, enabled: boolean) => void
    onToggleAutoStop: (app: ManagedApp, stop: boolean) => void
    preventAutoStop: boolean
    statuses: AppStatus[]
    summary: AppSummary
}

export function ApplicationsPanel({
    apps,
    iconUrls,
    onNavigateToApps,
    onStartAll,
    onStartApp,
    onStopAll,
    onStopApp,
    onOpenAppActions,
    onTogglePreventAutoStop,
    onToggleAutoLaunch,
    onToggleAutoStop,
    preventAutoStop,
    statuses,
    summary,
}: ApplicationsPanelProps) {
    const { t } = useTranslation()
    const statusByAppId = new Map(statuses.map((status) => [status.app_id, status]))
    const canStartAny = apps.some(
        (app) => app.enabled && statusByAppId.get(app.id)?.state.type !== 'running',
    )
    const canStopAny = statuses.some((status) => status.state.type === 'running')

    return (
        <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
            <div className="flex h-panel-header items-center justify-between border-b border-border px-6">
                <div className="flex items-center gap-2.5">
                    <span className="text-panel-title font-medium uppercase text-text-secondary">
                        {t('command.apps_panel')}
                    </span>
                    <span className="rounded-full bg-elevated px-2 py-0.5 text-xs font-semibold text-text-secondary">
                        {summary.total}
                    </span>
                </div>
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 rounded-md border border-border-strong bg-surface px-2.5 py-1.5">
                        <span className="text-xs text-text-secondary">
                            <span className="font-bold text-accent">
                                {t('apps.auto_stop_label_emphasis')}
                            </span>{' '}
                            {t('apps.auto_stop_label_rest')}
                        </span>
                        <Toggle
                            checked={preventAutoStop}
                            onChange={onTogglePreventAutoStop}
                            label={t('apps.auto_stop_label')}
                        />
                    </div>
                    <Button variant="ghost" size="md" disabled={!canStartAny} onClick={onStartAll}>
                        <Play
                            className="h-3 w-3 shrink-0 fill-current stroke-0"
                            aria-hidden="true"
                        />
                        {t('command.start_all')}
                    </Button>
                    <Button variant="ghost" size="md" disabled={!canStopAny} onClick={onStopAll}>
                        <Square
                            className="h-3 w-3 shrink-0 fill-current stroke-0"
                            aria-hidden="true"
                        />
                        {t('command.stop_all')}
                    </Button>
                    {onNavigateToApps && (
                        <Button variant="accent" size="md" onClick={onNavigateToApps}>
                            <Plus
                                className="h-3.5 w-3.5 shrink-0 stroke-[2.5]"
                                aria-hidden="true"
                            />
                            {t('command.add_app')}
                        </Button>
                    )}
                </div>
            </div>

            <div className="flex-1 overflow-y-auto bg-base">
                {apps.length === 0 ? (
                    <div className="min-h-32">
                        <EmptyState
                            icon={LayoutList}
                            message={t('command.no_apps')}
                            action={
                                onNavigateToApps ? (
                                    <Button onClick={onNavigateToApps}>
                                        {t('command.no_apps_action')}
                                    </Button>
                                ) : undefined
                            }
                        />
                    </div>
                ) : (
                    <div className="grid grid-cols-[auto_1fr_auto_auto]">
                        {apps.map((app) => (
                            <AppCommandRow
                                key={app.id}
                                app={app}
                                status={statusByAppId.get(app.id)}
                                iconUrl={iconUrls[app.id]}
                                onStart={() => onStartApp(app)}
                                onStop={() => onStopApp(app)}
                                onOpenMenu={
                                    onOpenAppActions ? () => onOpenAppActions(app) : undefined
                                }
                                onToggleAutoLaunch={(enabled) => onToggleAutoLaunch(app, enabled)}
                                onToggleAutoStop={(stop) => onToggleAutoStop(app, stop)}
                            />
                        ))}
                    </div>
                )}
            </div>
        </Panel>
    )
}
