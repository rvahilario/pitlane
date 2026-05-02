import { Fragment } from 'react'
import type { ElementType, ReactNode } from 'react'
import { CircleUser, Gauge, Settings } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { AppAvatar } from '@/components/AppAvatar'
import { cn } from '@/lib/cn'
import type { HeroConfig } from './readinessHeroConfig'

export type StatusItem = {
    key: string
    className: string
    label: string
}

function ReadinessOrb({ config }: { config: HeroConfig }) {
    const ReadinessIcon = config.icon

    return (
        <div
            className={cn(
                'relative flex h-status-orb w-status-orb shrink-0 items-center justify-center overflow-hidden rounded-full border-3',
                config.orbClass,
            )}
        >
            <span
                className={cn('absolute inset-0 rounded-full', config.orbSurfaceClass)}
                aria-hidden="true"
            />
            <span
                className={cn(
                    'pointer-events-none absolute -inset-px z-10 rounded-full opacity-70 mix-blend-screen blur-[2px]',
                    config.orbRimGlowClass,
                )}
                aria-hidden="true"
            />
            <ReadinessIcon
                className={cn(
                    'relative z-20 h-status-icon w-status-icon stroke-[2]',
                    config.headingClass,
                )}
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

export function HeroHeader({
    config,
    statusItems,
    title,
}: {
    config: HeroConfig
    statusItems: StatusItem[]
    title: string
}) {
    return (
        <div className="relative flex h-hero-main items-center gap-8 overflow-hidden px-10 py-6">
            <ReadinessOrb config={config} />

            <div className="min-w-0">
                <h2
                    className={cn(
                        'text-[length:var(--text-display-status)] font-semibold uppercase leading-none',
                        config.headingClass,
                    )}
                >
                    {title}
                </h2>
                <StatusLine items={statusItems} />
            </div>
        </div>
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
    icon: ElementType
    iconUrl?: string
    title: string
    titleClassName?: string
    className?: string
    separator?: boolean
    children: ReactNode
}) {
    return (
        <div
            className={cn(
                'relative flex h-full min-w-0 items-center justify-center gap-4 px-4 py-1',
                className,
            )}
        >
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

function ReadyPill({
    config,
    iconBorderClass,
    readyDisplay,
}: {
    config: HeroConfig
    iconBorderClass: string
    readyDisplay: string
}) {
    const { t } = useTranslation()
    const ReadinessIcon = config.icon

    return (
        <div className="relative flex flex-auto min-w-0 items-center justify-center px-8 py-4">
            <div
                className={cn(
                    'flex min-w-20 items-center justify-center gap-4 rounded-lg border px-6 py-2',
                    config.pillClass,
                )}
            >
                <div
                    className={cn(
                        'flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-3',
                        iconBorderClass,
                    )}
                >
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
    )
}

function AutomationStatus({
    autoLaunchOn,
    autoStopOn,
}: {
    autoLaunchOn: boolean
    autoStopOn: boolean
}) {
    const { t } = useTranslation()

    return (
        <p className="flex text-xs text-text-secondary gap-1">
            {t('command.auto_launch')}{' '}
            <span className={cn('font-bold', autoLaunchOn ? 'text-success' : 'text-text-muted')}>
                {autoLaunchOn ? t('command.on') : t('command.off')}
            </span>
            {' • '}
            {t('command.auto_stop')}{' '}
            <span className={cn('font-bold', autoStopOn ? 'text-success' : 'text-text-muted')}>
                {autoStopOn ? t('command.on') : t('command.off')}
            </span>
        </p>
    )
}

export function HeroDetails({
    activeProfileName,
    autoLaunchOn,
    autoStopOn,
    config,
    iRacingIconUrl,
    iRacingRunning,
    iconBorderClass,
    readyDisplay,
}: {
    activeProfileName?: string | null
    autoLaunchOn: boolean
    autoStopOn: boolean
    config: HeroConfig
    iRacingIconUrl?: string
    iRacingRunning: boolean
    iconBorderClass: string
    readyDisplay: string
}) {
    const { t } = useTranslation()

    return (
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

            <ReadyPill
                config={config}
                iconBorderClass={iconBorderClass}
                readyDisplay={readyDisplay}
            />

            <ReadinessInfoTile
                icon={CircleUser}
                title={t('shell.active_profile')}
                className="flex-auto"
                separator
            >
                <p className="truncate text-sm text-accent">{activeProfileName ?? '-'}</p>
            </ReadinessInfoTile>

            <ReadinessInfoTile
                icon={Settings}
                title={t('command.automation')}
                className="flex-auto"
            >
                <AutomationStatus autoLaunchOn={autoLaunchOn} autoStopOn={autoStopOn} />
            </ReadinessInfoTile>
        </div>
    )
}
