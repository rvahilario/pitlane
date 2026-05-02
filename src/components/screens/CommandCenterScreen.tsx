import {
    AlertTriangle,
    CheckCircle2,
    CircleUser,
    Gauge,
    LayoutList,
    Play,
    Plus,
    Settings,
    Square,
    WifiOff,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { api, type ManagedApp } from '@/lib/api'
import {
    computeAppSummary,
    computeReadiness,
    formatTime,
    KIND_VARIANT,
    type Readiness,
} from '@/lib/command-center'
import { useApps, useAppStatuses, useIRacingStatus, useLog } from '@/hooks'
import { ActivityRow, AppCommandRow, Button, EmptyState, Panel } from '@/components/ui'
import { cn } from '@/lib/cn'

// Re-export for backward-compat with existing tests
export { computeAppSummary, computeReadiness } from '@/lib/command-center'
export type { AppSummary, Readiness } from '@/lib/command-center'

// --- Config ---

const READINESS_CONFIG: Record<
    Readiness,
    { icon: React.ElementType; headingClass: string; pillClass: string; glowClass: string | null }
> = {
    ready: {
        icon: CheckCircle2,
        headingClass: 'text-success',
        pillClass: 'border-success/50 bg-success/10 text-success',
        glowClass: 'from-success/20',
    },
    needs_attention: {
        icon: AlertTriangle,
        headingClass: 'text-warning',
        pillClass: 'border-warning/50 bg-warning/10 text-warning',
        glowClass: 'from-warning/15',
    },
    no_iracing: {
        icon: WifiOff,
        headingClass: 'text-text-muted',
        pillClass: 'border-border text-text-muted',
        glowClass: null,
    },
}

const RECENT_COUNT = 6

// --- Screen ---

interface CommandCenterScreenProps {
    onNavigateToApps?: () => void
}

export function CommandCenterScreen({ onNavigateToApps }: CommandCenterScreenProps) {
    const { t } = useTranslation()
    const { apps, activeProfile, preventAutoStop, toggleEnabled, toggleStopWithIracing } =
        useApps()
    const statuses = useAppStatuses()
    const iRacingRunning = useIRacingStatus()
    const log = useLog()

    const summary = computeAppSummary(apps, statuses)
    const readiness = computeReadiness(iRacingRunning, summary.crashed)
    const { icon: ReadinessIcon, headingClass, pillClass, glowClass } = READINESS_CONFIG[readiness]

    const enabledTotal = summary.total - summary.disabled
    const readyDisplay = enabledTotal > 0 ? `${summary.ready} / ${enabledTotal}` : '0 / 0'

    const recentActivity = [...log].reverse().slice(0, RECENT_COUNT)

    const autoLaunchOn = apps.some((a) => a.enabled)
    const autoStopOn = !preventAutoStop

    function handleStart(app: ManagedApp) {
        api.forceLaunchApp(app.id).catch(() => {})
    }

    function handleStop(app: ManagedApp) {
        api.forceKillApp(app.id).catch(() => {})
    }

    return (
        <div className="flex h-full min-h-[36rem] flex-col gap-3 overflow-hidden p-4">
            {/* ── Hero ── */}
            <Panel className="relative shrink-0 overflow-hidden">
                {/* Background glow */}
                {glowClass && (
                    <div
                        className={cn(
                            'pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l via-transparent to-transparent',
                            glowClass,
                        )}
                    />
                )}

                {/* Main status row */}
                <div className="relative flex h-[7rem] items-center gap-5 px-6 py-5 overflow-hidden">
                    <div
                        className={cn(
                            'flex h-16 w-16 shrink-0 items-center justify-center rounded-full border-2',
                            readiness === 'ready'
                                ? 'border-success bg-success/10'
                                : readiness === 'needs_attention'
                                  ? 'border-warning bg-warning/10'
                                  : 'border-border-strong bg-elevated',
                        )}
                    >
                        <ReadinessIcon
                            className={cn('h-8 w-8 stroke-[2]', headingClass)}
                            aria-hidden="true"
                        />
                    </div>

                    <div className="min-w-0">
                        <h2
                            className={cn(
                                'text-4xl font-bold uppercase leading-none tracking-wide',
                                headingClass,
                            )}
                        >
                            {t(`command.readiness.${readiness}`)}
                        </h2>
                        <p className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                            <span className="text-text-secondary">
                                {iRacingRunning
                                    ? t('command.iracing_detected')
                                    : t('command.iracing_offline')}
                            </span>
                            {summary.total > 0 && (
                                <>
                                    <span className="text-text-muted">•</span>
                                    <span className="text-success">
                                        {summary.running}{' '}
                                        {t('command.metrics.running').toLowerCase()}
                                    </span>
                                    <span className="text-text-muted">•</span>
                                    <span className="text-danger">
                                        {summary.crashed}{' '}
                                        {t('command.metrics.crashed').toLowerCase()}
                                    </span>
                                    <span className="text-text-muted">•</span>
                                    <span className="text-text-muted">
                                        {summary.idle} {t('command.metrics.idle').toLowerCase()}
                                    </span>
                                </>
                            )}
                        </p>
                    </div>
                </div>

                {/* Info bar */}
                <div className="relative flex h-[3.5rem] divide-x divide-border border-t border-border overflow-hidden">
                    {/* iRacing section */}
                    <div className="flex min-w-40 items-center gap-3 px-5 py-3.5">
                        <Gauge
                            className="h-7 w-7 shrink-0 text-accent stroke-[1.5]"
                            aria-hidden="true"
                        />
                        <div>
                            <p className="text-xs font-semibold text-text">iRacing</p>
                            <p
                                className={cn(
                                    'text-xs font-bold',
                                    iRacingRunning ? 'text-success' : 'text-text-muted',
                                )}
                            >
                                {iRacingRunning
                                    ? t('command.iracing_detected')
                                    : t('command.iracing_offline')}
                            </p>
                        </div>
                    </div>

                    {/* Ready pill */}
                    <div className="flex flex-1 items-center justify-center px-6 py-3.5">
                        <div
                            className={cn(
                                'flex items-center gap-3 rounded-lg border px-5 py-2.5',
                                pillClass,
                            )}
                        >
                            <ReadinessIcon
                                className="h-5 w-5 shrink-0 stroke-[2]"
                                aria-hidden="true"
                            />
                            <span className="text-xl font-bold">
                                {readyDisplay} {t('command.ready')}
                            </span>
                        </div>
                    </div>

                    {/* Active profile */}
                    <div className="flex min-w-44 items-center gap-3 px-5 py-3.5">
                        <CircleUser
                            className="h-5 w-5 shrink-0 text-text-muted stroke-[1.5]"
                            aria-hidden="true"
                        />
                        <div>
                            <p className="text-xs text-text-muted">{t('shell.active_profile')}</p>
                            <p className="text-sm font-medium text-accent">
                                {activeProfile?.name ?? '—'}
                            </p>
                        </div>
                    </div>

                    {/* Automation */}
                    <div className="flex min-w-52 items-center gap-3 px-5 py-3.5">
                        <Settings
                            className="h-5 w-5 shrink-0 text-text-muted stroke-[1.5]"
                            aria-hidden="true"
                        />
                        <div>
                            <p className="text-xs text-text-muted">{t('command.automation')}</p>
                            <p className="text-xs text-text-secondary">
                                {t('command.auto_launch')}{' '}
                                <span
                                    className={cn(
                                        'font-bold',
                                        autoLaunchOn ? 'text-success' : 'text-text-muted',
                                    )}
                                >
                                    {autoLaunchOn ? t('command.on') : t('command.off')}
                                </span>
                                {' • '}
                                {t('command.auto_stop')}{' '}
                                <span
                                    className={cn(
                                        'font-bold',
                                        autoStopOn ? 'text-success' : 'text-text-muted',
                                    )}
                                >
                                    {autoStopOn ? t('command.on') : t('command.off')}
                                </span>
                            </p>
                        </div>
                    </div>
                </div>
            </Panel>

            {/* ── Applications ── */}
            <Panel className="flex min-h-0 flex-1 flex-col">
                {/* Panel header */}
                <div className="flex items-center justify-between border-b border-border px-4 py-3">
                    <div className="flex items-center gap-2.5">
                        <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                            {t('command.apps_panel')}
                        </span>
                        <span className="rounded-full bg-elevated px-2 py-0.5 text-xs font-semibold text-text-secondary">
                            {summary.total}
                        </span>
                    </div>
                    <div className="flex items-center gap-1.5">
                        <Button variant="ghost" size="sm" disabled>
                            <Play
                                className="h-3 w-3 shrink-0 fill-current stroke-0"
                                aria-hidden="true"
                            />
                            {t('command.start_all')}
                        </Button>
                        <Button variant="ghost" size="sm" disabled>
                            <Square
                                className="h-3 w-3 shrink-0 fill-current stroke-0"
                                aria-hidden="true"
                            />
                            {t('command.stop_all')}
                        </Button>
                        {onNavigateToApps && (
                            <Button variant="accent" size="sm" onClick={onNavigateToApps}>
                                <Plus
                                    className="h-3.5 w-3.5 shrink-0 stroke-[2.5]"
                                    aria-hidden="true"
                                />
                                {t('command.add_app')}
                            </Button>
                        )}
                    </div>
                </div>

                {/* App list */}
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
                                onStart={() => handleStart(app)}
                                onStop={() => handleStop(app)}
                                onToggleAutoLaunch={(enabled) => toggleEnabled(app, enabled)}
                                onToggleAutoStop={(stop) => toggleStopWithIracing(app, stop)}
                            />
                        ))
                    )}
                </div>
            </Panel>

            {/* ── Recent Activity ── */}
            {recentActivity.length > 0 && (
                <Panel className="shrink-0">
                    <div className="flex items-center border-b border-border px-4 py-3">
                        <span className="text-xs font-bold uppercase tracking-wider text-text-muted">
                            {t('command.activity_panel')}
                        </span>
                    </div>
                    {recentActivity.map((entry) => (
                        <ActivityRow
                            key={entry.seq}
                            time={formatTime(entry.timestamp_ms)}
                            event={t(`command.log_events.${entry.kind}`)}
                            variant={KIND_VARIANT[entry.kind]}
                            source={entry.app ?? undefined}
                            message={entry.msg}
                        />
                    ))}
                </Panel>
            )}
        </div>
    )
}
