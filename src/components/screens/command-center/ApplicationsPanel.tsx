import { LayoutList, Play, Plus, Square } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AppCommandRow, Button, EmptyState, Panel } from '@/components/ui'
import type { AppStatus, ManagedApp } from '@/lib/api'
import type { AppSummary } from '@/lib/command-center'

interface ApplicationsPanelProps {
    apps: ManagedApp[]
    iconUrls: Record<string, string | undefined>
    onNavigateToApps?: () => void
    onStartApp: (app: ManagedApp) => void
    onStopApp: (app: ManagedApp) => void
    onToggleAutoLaunch: (app: ManagedApp, enabled: boolean) => void
    onToggleAutoStop: (app: ManagedApp, stop: boolean) => void
    statuses: AppStatus[]
    summary: AppSummary
}

export function ApplicationsPanel({
    apps,
    iconUrls,
    onNavigateToApps,
    onStartApp,
    onStopApp,
    onToggleAutoLaunch,
    onToggleAutoStop,
    statuses,
    summary,
}: ApplicationsPanelProps) {
    const { t } = useTranslation()

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
                    <Button variant="ghost" size="md" disabled>
                        <Play
                            className="h-3 w-3 shrink-0 fill-current stroke-0"
                            aria-hidden="true"
                        />
                        {t('command.start_all')}
                    </Button>
                    <Button variant="ghost" size="md" disabled>
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

            <div className="flex-1 overflow-y-auto">
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
                    apps.map((app) => (
                        <AppCommandRow
                            key={app.id}
                            app={app}
                            status={statuses.find((s) => s.app_id === app.id)}
                            iconUrl={iconUrls[app.id]}
                            onStart={() => onStartApp(app)}
                            onStop={() => onStopApp(app)}
                            onToggleAutoLaunch={(enabled) => onToggleAutoLaunch(app, enabled)}
                            onToggleAutoStop={(stop) => onToggleAutoStop(app, stop)}
                        />
                    ))
                )}
            </div>
        </Panel>
    )
}
