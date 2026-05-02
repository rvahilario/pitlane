import { api, type ManagedApp } from '@/lib/api'
import { computeAppSummary, computeReadiness } from '@/lib/command-center'
import { useApps, useAppStatuses, useIRacingStatus, useLog } from '@/hooks'
import { ApplicationsPanel } from './command-center/ApplicationsPanel'
import { ReadinessHero } from './command-center/ReadinessHero'
import { RecentActivityPanel } from './command-center/RecentActivityPanel'
import { useAppIconUrls } from './command-center/useAppIconUrls'

// Re-export for backward-compat with existing tests
export { computeAppSummary, computeReadiness } from '@/lib/command-center'
export type { AppSummary, Readiness } from '@/lib/command-center'

const RECENT_COUNT = 6

interface CommandCenterScreenProps {
    onNavigateToApps?: () => void
}

export function CommandCenterScreen({ onNavigateToApps }: CommandCenterScreenProps) {
    const { apps, activeProfile, preventAutoStop, toggleEnabled, toggleStopWithIracing } = useApps()
    const statuses = useAppStatuses()
    const iRacingRunning = useIRacingStatus()
    const log = useLog()
    const iconUrls = useAppIconUrls(apps)

    const summary = computeAppSummary(apps, statuses)
    const readiness = computeReadiness(iRacingRunning, summary.crashed)

    const enabledTotal = summary.total - summary.disabled
    const readyDisplay = enabledTotal > 0 ? `${summary.running} / ${enabledTotal}` : '-/-'

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
        <div className="flex h-full min-h-0 flex-col gap-panel-gap overflow-hidden p-content-pad">
            <ReadinessHero
                activeProfileName={activeProfile?.name}
                autoLaunchOn={autoLaunchOn}
                autoStopOn={autoStopOn}
                iRacingRunning={iRacingRunning}
                readiness={readiness}
                readyDisplay={readyDisplay}
                summary={summary}
            />

            <ApplicationsPanel
                apps={apps}
                iconUrls={iconUrls}
                onNavigateToApps={onNavigateToApps}
                onStartApp={handleStart}
                onStopApp={handleStop}
                onToggleAutoLaunch={toggleEnabled}
                onToggleAutoStop={toggleStopWithIracing}
                statuses={statuses}
                summary={summary}
            />

            <RecentActivityPanel entries={recentActivity} />
        </div>
    )
}
