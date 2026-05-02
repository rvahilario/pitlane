import { Fragment } from 'react'
import { AlertTriangle, Check, CircleUser, Gauge, Settings, X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AppAvatar } from '@/components/AppAvatar'
import { Panel } from '@/components/ui'
import { cn } from '@/lib/cn'
import type { AppSummary, Readiness } from '@/lib/command-center'
import { useIRacingIconUrl } from './useIRacingIconUrl'

type ReadinessConfig = {
    icon: React.ElementType
    headingClass: string
    orbClass: string
    orbRimGlowClass: string
    orbSurfaceClass: string
    pillClass: string
    glowClass: string | null
}

type StatusItem = {
    key: string
    className: string
    label: string
}

const READINESS_CONFIG: Record<Readiness, ReadinessConfig> = {
    ready: {
        icon: Check,
        headingClass: 'text-success',
        orbClass:
            'border-success shadow-[0_0_34px_rgba(71,209,140,0.46),0_0_86px_rgba(71,209,140,0.22)]',
        orbRimGlowClass:
            'bg-[radial-gradient(circle_at_29%_19%,rgba(216,255,251,0.42)_0%,rgba(216,255,251,0.22)_9%,rgba(71,209,140,0.14)_18%,transparent_30%)]',
        orbSurfaceClass:
            'bg-[radial-gradient(circle_at_34%_28%,rgba(216,255,251,0.32),transparent_28%),linear-gradient(145deg,rgba(71,209,140,0.92)_0%,rgba(39,155,99,0.54)_38%,rgba(6,19,12,0.98)_100%)] shadow-[inset_0_0_24px_rgba(216,255,251,0.16),inset_18px_22px_54px_rgba(6,19,12,0.72),inset_-14px_-18px_42px_rgba(2,7,7,0.50)]',
        pillClass: 'border-success/50 bg-success/10 text-success',
        glowClass: 'from-success/20',
    },
    needs_attention: {
        icon: AlertTriangle,
        headingClass: 'text-warning',
        orbClass:
            'border-warning shadow-[0_0_34px_rgba(242,201,76,0.44),0_0_86px_rgba(242,201,76,0.20)]',
        orbRimGlowClass:
            'bg-[radial-gradient(circle_at_29%_19%,rgba(255,244,190,0.42)_0%,rgba(255,224,130,0.24)_9%,rgba(242,201,76,0.14)_18%,transparent_30%)]',
        orbSurfaceClass:
            'bg-[radial-gradient(circle_at_34%_28%,rgba(255,224,130,0.34),transparent_28%),linear-gradient(145deg,rgba(242,201,76,0.92)_0%,rgba(171,128,20,0.56)_38%,rgba(23,17,4,0.98)_100%)] shadow-[inset_0_0_24px_rgba(255,224,130,0.18),inset_18px_22px_54px_rgba(23,17,4,0.74),inset_-14px_-18px_42px_rgba(23,17,4,0.52)]',
        pillClass: 'border-warning/50 bg-warning/10 text-warning',
        glowClass: 'from-warning/15',
    },
    no_iracing: {
        icon: X,
        headingClass: 'text-text-muted',
        orbClass:
            'border-border shadow-[0_0_28px_rgba(169,153,211,0.24),0_0_70px_rgba(51,38,79,0.24)]',
        orbRimGlowClass:
            'bg-[radial-gradient(circle_at_29%_19%,rgba(244,240,255,0.28)_0%,rgba(209,197,242,0.16)_9%,rgba(169,153,211,0.10)_18%,transparent_30%)]',
        orbSurfaceClass:
            'bg-[radial-gradient(circle_at_34%_28%,rgba(244,240,255,0.10),transparent_26%),linear-gradient(145deg,rgba(169,153,211,0.30)_0%,rgba(51,38,79,0.38)_38%,rgba(9,7,20,0.62)_100%)] shadow-[inset_0_0_12px_rgba(244,240,255,0.02),inset_12px_16px_30px_rgba(9,7,20,0.05),inset_-8px_-10px_24px_rgba(9,7,20,0.03)]',
        pillClass: 'border-border text-text-muted',
        glowClass: null,
    },
}

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

function ReadinessOrb({
    icon: ReadinessIcon,
    headingClass,
    orbClass,
    orbRimGlowClass,
    orbSurfaceClass,
}: Pick<
    ReadinessConfig,
    'icon' | 'headingClass' | 'orbClass' | 'orbRimGlowClass' | 'orbSurfaceClass'
>) {
    return (
        <div
            className={cn(
                'relative flex h-status-orb w-status-orb shrink-0 items-center justify-center overflow-hidden rounded-full border-3',
                orbClass,
            )}
        >
            <span
                className={cn('absolute inset-0 rounded-full', orbSurfaceClass)}
                aria-hidden="true"
            />
            <span
                className={cn(
                    'pointer-events-none absolute -inset-px z-10 rounded-full opacity-70 mix-blend-screen blur-[2px]',
                    orbRimGlowClass,
                )}
                aria-hidden="true"
            />
            <ReadinessIcon
                className={cn('relative z-20 h-status-icon w-status-icon stroke-[2]', headingClass)}
                aria-hidden="true"
            />
        </div>
    )
}

function StatusLine({ items }: { items: StatusItem[] }) {
    return (
        <p className="mt-4 flex flex-wrap items-center gap-3 text-body-ui">
            {items.map((item, index) => (
                <Fragment key={item.key}>
                    <span className={item.className}>{item.label}</span>
                    {index < items.length - 1 && (
                        <span
                            className="h-2 w-2 shrink-0 rounded-full bg-text-muted/70"
                            aria-hidden="true"
                        />
                    )}
                </Fragment>
            ))}
        </p>
    )
}

function ReadinessInfoTile({
    icon: Icon,
    iconUrl,
    title,
    titleClassName = 'text-text-muted',
    className,
    separator = false,
    children,
}: {
    icon: React.ElementType
    iconUrl?: string
    title: string
    titleClassName?: string
    className?: string
    separator?: boolean
    children: React.ReactNode
}) {
    return (
        <div className={cn('relative flex h-full min-w-0 items-center justify-center gap-4 px-4 py-1', className)}>
            {iconUrl ? (
                <AppAvatar name={title} iconUrl={iconUrl} className="h-9 w-9" />
            ) : (
                <Icon
                    className="h-9 w-9 shrink-0 text-text-secondary stroke-[1.5]"
                    aria-hidden="true"
                />
            )}
            <div className="min-w-0">
                <p className={cn('text-body-ui', titleClassName)}>{title}</p>
                <div className="mt-px min-w-0">{children}</div>
            </div>
            {separator && (
                <span
                    className="pointer-events-none absolute right-0 top-1/2 h-1/2 w-px -translate-y-1/2 bg-border"
                    aria-hidden="true"
                />
            )}
        </div>
    )
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
    const {
        icon: ReadinessIcon,
        headingClass,
        orbClass,
        orbRimGlowClass,
        orbSurfaceClass,
        pillClass,
        glowClass,
    } = READINESS_CONFIG[readiness]
    const statusItems = buildStatusItems({ t, iRacingRunning, summary })
    const iRacingIconUrl = useIRacingIconUrl(iRacingRunning)
    const nonIdle = summary.running + summary.crashed
    const iconBorderClass =
        nonIdle === 0
            ? 'border-border'
            : summary.running === nonIdle
              ? 'border-success'
              : 'border-warning'

    return (
        <Panel className="relative flex h-hero shrink-0 flex-col overflow-hidden bg-gradient-to-br from-surface via-surface to-base shadow-[0_0_40px_rgba(77,217,208,0.05)]">
            {glowClass && (
                <div
                    className={cn(
                        'pointer-events-none absolute inset-y-0 right-0 w-1/2 bg-gradient-to-l via-transparent to-transparent',
                        glowClass,
                    )}
                />
            )}

            <div className="relative flex h-hero-main items-center gap-8 overflow-hidden px-10 py-6">
                <ReadinessOrb
                    icon={ReadinessIcon}
                    headingClass={headingClass}
                    orbClass={orbClass}
                    orbRimGlowClass={orbRimGlowClass}
                    orbSurfaceClass={orbSurfaceClass}
                />

                <div className="min-w-0">
                    <h2
                        className={cn(
                            'text-[length:var(--text-display-status)] font-semibold uppercase leading-none',
                            headingClass,
                        )}
                    >
                        {t(`command.readiness.${readiness}`)}
                    </h2>
                    <StatusLine items={statusItems} />
                </div>
            </div>

            <div className="relative flex min-h-0 flex-1 items-stretch overflow-hidden border-t border-border">
                <ReadinessInfoTile
                    icon={Gauge}
                    iconUrl={iRacingIconUrl}
                    title="iRacing"
                    titleClassName="text-text"
                    className="flex-auto"
                    separator
                >
                    <p
                        className={cn(
                            'text-body-ui font-medium',
                            iRacingRunning ? 'text-success' : 'text-text-muted',
                        )}
                    >
                        <span className="text-sm">
                            {iRacingRunning
                                ? t('command.iracing_detected')
                                : t('command.iracing_offline')}
                        </span>
                    </p>
                </ReadinessInfoTile>

                <div className="relative flex flex-auto min-w-0 items-center justify-center px-8 py-4">
                    <div
                        className={cn(
                            'flex min-w-20 items-center justify-center gap-4 rounded-lg border px-6 py-2',
                            pillClass,
                        )}
                    >
                        <div className={cn('flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-3', iconBorderClass)}>
                            <ReadinessIcon className="h-5.5 w-5.5 stroke-3" aria-hidden="true" />
                        </div>
                        <span className="truncate text-lg font-bold">
                            {readyDisplay} {t('command.ready')}
                        </span>
                    </div>
                    <span
                        className="pointer-events-none absolute right-0 top-1/2 h-1/2 w-px -translate-y-1/2 bg-border"
                        aria-hidden="true"
                    />
                </div>

                <ReadinessInfoTile icon={CircleUser} title={t('shell.active_profile')} className="flex-auto" separator>
                    <p className="truncate text-sm  text-accent">{activeProfileName ?? '-'}</p>
                </ReadinessInfoTile>

                <ReadinessInfoTile icon={Settings} title={t('command.automation')} className="flex-auto">
                    <p className="flex text-xs text-text-secondary gap-1">
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
                </ReadinessInfoTile>
            </div>
        </Panel>
    )
}
