import { AlertTriangle, CheckCircle2, Circle, MinusCircle } from 'lucide-react'
import { cn } from '@/lib/cn'

const VARIANT_CONFIG = {
    launch: { icon: CheckCircle2, className: 'text-success' },
    stop: { icon: MinusCircle, className: 'text-text-muted' },
    crashed: { icon: AlertTriangle, className: 'text-danger' },
    restarted: { icon: CheckCircle2, className: 'text-warning' },
    iracing: { icon: CheckCircle2, className: 'text-accent' },
    error: { icon: AlertTriangle, className: 'text-danger' },
    info: { icon: Circle, className: 'text-text-muted' },
} as const

export type ActivityRowVariant = keyof typeof VARIANT_CONFIG

export interface ActivityRowProps extends React.HTMLAttributes<HTMLDivElement> {
    variant?: ActivityRowVariant
    time: React.ReactNode
    event: string
    source?: React.ReactNode
    message?: React.ReactNode
}

export function ActivityRow({
    time,
    event,
    source,
    message,
    variant = 'info',
    className,
    ...props
}: ActivityRowProps) {
    const { icon: Icon, className: iconClass } = VARIANT_CONFIG[variant]

    return (
        <div
            className={cn(
                'flex items-center gap-3 border-b border-border px-4 py-2.5 text-xs last:border-b-0 transition-colors hover:bg-accent-tint',
                className,
            )}
            {...props}
        >
            <span className="w-20 shrink-0 font-mono text-text-muted">{time}</span>
            <Icon
                className={cn('h-3.5 w-3.5 shrink-0 stroke-[2.5]', iconClass)}
                role="img"
                aria-label={event}
            />
            <span className="w-24 shrink-0 font-medium text-text">{source}</span>
            <span className={cn('min-w-0 truncate', iconClass)}>{message}</span>
        </div>
    )
}
