import {
    AlertTriangle,
    CheckCircle2,
    CircleCheck,
    CircleUser,
    Clock3,
    Filter,
    Gauge,
    LayoutList,
    Play,
    Plus,
    Settings,
    Square,
} from 'lucide-react'
import { useEffect, useState } from 'react'
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
        icon: CircleCheck,
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
    const { apps, activeProfile, preventAutoStop, toggleEnabled, toggleStopWithIracing } = useApps()
    const statuses = useAppStatuses()
    const iRacingRunning = useIRacingStatus()
    const log = useLog()
    const [iconUrls, setIconUrls] = useState<Record<string, string | undefined>>({})

    const summary = computeAppSummary(apps, statuses)
    const readiness = computeReadiness(iRacingRunning, summary.crashed)
    const { icon: ReadinessIcon, headingClass, pillClass, glowClass } = READINESS_CONFIG[readiness]

    const enabledTotal = summary.total - summary.disabled
    const readyDisplay = enabledTotal > 0 ? `${summary.ready} / ${enabledTotal}` : '0 / 0'

    const recentActivity = [...log].reverse().slice(0, RECENT_COUNT)

    const autoLaunchOn = apps.some((a) => a.enabled)
    const autoStopOn = !preventAutoStop

    useEffect(() => {
        if (typeof api.extractIcon !== 'function') return

        let cancelled = false

        apps.forEach((app) => {
            api.extractIcon(app.exe_path)
                .then((b64) => {
                    if (cancelled) return
                    setIconUrls((prev) => ({
                        ...prev,
                        [app.id]: b64 ? `data:image/png;base64,${b64}` : undefined,
                    }))
                })
                .catch(() => {})
        })

        return () => {
            cancelled = true
        }
    }, [apps])

    function handleStart(app: ManagedApp) {
        api.forceLaunchApp(app.id).catch(() => {})
    }

    function handleStop(app: ManagedApp) {
        api.forceKillApp(app.id).catch(() => {})
    }

    return (
        <div className="flex h-full min-h-0 flex-col gap-panel-gap overflow-hidden p-content-pad">
            {/* ── Hero ── */}
            <Panel className="relative h-hero shrink-0 overflow-hidden bg-gradient-to-br from-surface via-surface to-base shadow-[0_0_40px_rgba(77,217,208,0.05)]">
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
                <div className="relative flex h-hero-main items-center gap-8 overflow-hidden px-10 py-6">
                    <div
                        className={cn(
                            'flex h-status-orb w-status-orb shrink-0 items-center justify-center rounded-full border-2 shadow-[0_0_34px_rgba(71,209,140,0.18)]',
                            readiness === 'ready'
                                ? 'border-success bg-success/10'
                                : readiness === 'needs_attention'
                                  ? 'border-warning bg-warning/10'
                                  : 'border-border-strong bg-elevated',
                        )}
                    >
                        <ReadinessIcon
                            className={cn('h-status-icon w-status-icon stroke-[2]', headingClass)}
                            aria-hidden="true"
                        />
                    </div>

                    <div className="min-w-0">
                        <h2
                            className={cn(
                                'text-display-status font-bold uppercase leading-none',
                                headingClass,
                            )}
                        >
                            {t(`command.readiness.${readiness}`)}
                        </h2>
                        <p className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-body-ui">
                            <span className="text-text-secondary">
                                {iRacingRunning
                                    ? t('command.iracing_detected')
                                    : t('command.iracing_offline')}
                            </span>
                            {summary.total > 0 && (
                                <>
                                    <span className="text-success">
                                        {summary.running}{' '}
                                        {t('command.metrics.running').toLowerCase()}
                                    </span>
                                    <span className="text-danger">
                                        {summary.crashed}{' '}
                                        {t('command.metrics.crashed').toLowerCase()}
                                    </span>
                                    <span className="text-text-muted">
                                        {summary.idle} {t('command.metrics.idle').toLowerCase()}
                                    </span>
                                </>
                            )}
                        </p>
                    </div>
                </div>

                {/* Info bar */}
                <div className="relative grid h-hero-info grid-cols-[1.1fr_1.7fr_1.1fr_1.4fr] divide-x divide-border overflow-hidden border-t border-border">
                    {/* iRacing section */}
                    <div className="flex min-w-0 items-center gap-4 px-8 py-4">
                        <Gauge
                            className="h-7 w-7 shrink-0 text-accent stroke-[1.5]"
                            aria-hidden="true"
                        />
                        <div>
                            <p className="text-body-ui font-semibold text-text">iRacing</p>
                            <p
                                className={cn(
                                    'mt-1 text-body-ui font-bold',
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
                    <div className="flex min-w-0 items-center justify-center px-8 py-4">
                        <div
                            className={cn(
                                'flex h-[4.5rem] min-w-72 items-center justify-center gap-4 rounded-lg border px-6',
                                pillClass,
                            )}
                        >
                            <ReadinessIcon
                                className="h-8 w-8 shrink-0 stroke-[2]"
                                aria-hidden="true"
                            />
                            <span className="truncate text-3xl font-bold">
                                {readyDisplay} {t('command.ready')}
                            </span>
                        </div>
                    </div>

                    {/* Active profile */}
                    <div className="flex min-w-0 items-center gap-4 px-8 py-4">
                        <CircleUser
                            className="h-9 w-9 shrink-0 text-text-secondary stroke-[1.5]"
                            aria-hidden="true"
                        />
                        <div>
                            <p className="text-body-ui text-text-muted">
                                {t('shell.active_profile')}
                            </p>
                            <p className="mt-1 truncate text-body-ui font-medium text-accent">
                                {activeProfile?.name ?? '—'}
                            </p>
                        </div>
                    </div>

                    {/* Automation */}
                    <div className="flex min-w-0 items-center gap-4 px-8 py-4">
                        <Settings
                            className="h-9 w-9 shrink-0 text-text-secondary stroke-[1.5]"
                            aria-hidden="true"
                        />
                        <div>
                            <p className="text-body-ui text-text-muted">
                                {t('command.automation')}
                            </p>
                            <p className="mt-1 text-body-ui text-text-secondary">
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
            <Panel className="flex min-h-0 flex-1 flex-col overflow-hidden">
                {/* Panel header */}
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
                                iconUrl={iconUrls[app.id]}
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
                {recentActivity.length > 0 ? (
                    recentActivity.map((entry) => (
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
        </div>
    )
}
