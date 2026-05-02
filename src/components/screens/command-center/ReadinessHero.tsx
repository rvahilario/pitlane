import { useTranslation } from 'react-i18next'
import { Panel } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { AppSummary, Readiness } from '@/lib/command-center'
import { HeroDetails, HeroHeader, type StatusItem } from './ReadinessHeroParts'
import { readinessConfig } from './readinessHeroConfig'
import { useIRacingIconUrl } from './useIRacingIconUrl'

function buildStatusItems({
    t,
    iRacingRunning,
    summary,
}: {
    t: ReturnType<typeof useTranslation>['t']
    iRacingRunning: boolean
    summary: AppSummary
}): StatusItem[] {
    const items: StatusItem[] = [
        {
            key: 'iracing',
            className: 'text-text-secondary',
            label: iRacingRunning ? t('command.iracing_detected') : t('command.iracing_offline'),
        },
    ]

    if (summary.total > 0) {
        items.push(
            {
                key: 'running',
                className: 'text-success',
                label: `${summary.running} ${t('command.metrics.running').toLowerCase()}`,
            },
            {
                key: 'crashed',
                className: 'text-danger',
                label: `${summary.crashed} ${t('command.metrics.crashed').toLowerCase()}`,
            },
            {
                key: 'idle',
                className: 'text-text-muted',
                label: `${summary.idle} ${t('command.metrics.idle').toLowerCase()}`,
            },
        )
    }

    return items
}

function readyIconBorderClass(summary: AppSummary) {
    const nonIdle = summary.running + summary.crashed

    if (nonIdle === 0) return 'border-border'
    if (summary.running === nonIdle) return 'border-success'
    return 'border-warning'
}

interface ReadinessHeroProps {
    activeProfileName?: string | null
    autoLaunchOn: boolean
    autoStopOn: boolean
    iRacingRunning: boolean
    readiness: Readiness
    readyDisplay: string
    summary: AppSummary
}

export function ReadinessHero({
    activeProfileName,
    autoLaunchOn,
    autoStopOn,
    iRacingRunning,
    readiness,
    readyDisplay,
    summary,
}: ReadinessHeroProps) {
    const { t } = useTranslation()
    const config = readinessConfig(readiness)
    const statusItems = buildStatusItems({ t, iRacingRunning, summary })
    const iRacingIconUrl = useIRacingIconUrl(iRacingRunning)

    return (
        <Panel className="relative flex h-hero shrink-0 flex-col overflow-hidden bg-gradient-to-br from-surface via-surface to-base shadow-[0_0_40px_rgba(77,217,208,0.05)]">
            {config.glowClass && (
                <div
                    className={cn(
                        'pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l via-transparent to-transparent',
                        config.glowClass,
                    )}
                />
            )}

            <HeroHeader
                config={config}
                statusItems={statusItems}
                title={t(`command.readiness.${readiness}`)}
            />
            <HeroDetails
                activeProfileName={activeProfileName}
                autoLaunchOn={autoLaunchOn}
                autoStopOn={autoStopOn}
                config={config}
                iRacingIconUrl={iRacingIconUrl}
                iRacingRunning={iRacingRunning}
                iconBorderClass={readyIconBorderClass(summary)}
                readyDisplay={readyDisplay}
            />
        </Panel>
    )
}
