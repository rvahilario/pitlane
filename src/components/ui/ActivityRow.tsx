import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const eventChip = cva(
    'inline-flex min-w-20 justify-center rounded border px-1.5 py-0.5 text-[11px] font-semibold uppercase tracking-normal',
    {
        variants: {
            variant: {
                launch: 'border-success/40 bg-success/10 text-success',
                stop: 'border-warning/45 bg-warning/10 text-warning',
                iracing: 'border-accent/40 bg-accent/10 text-accent',
                error: 'border-danger/45 bg-danger/10 text-danger',
                info: 'border-border-strong bg-elevated text-text-secondary',
            },
        },
        defaultVariants: {
            variant: 'info',
        },
    },
)

export interface ActivityRowProps
    extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof eventChip> {
    time: React.ReactNode
    event: React.ReactNode
    source?: React.ReactNode
    message?: React.ReactNode
}

export function ActivityRow({
    time,
    event,
    source,
    message,
    variant,
    className,
    ...props
}: ActivityRowProps) {
    return (
        <div
            className={cn(
                'grid grid-cols-[5rem_5.5rem_minmax(6rem,10rem)_1fr] items-center gap-3 border-b border-border px-3 py-2 text-xs last:border-b-0',
                className,
            )}
            {...props}
        >
            <span className="font-mono text-text-muted">{time}</span>
            <span className={eventChip({ variant })}>{event}</span>
            <span className="min-w-0 truncate text-text-secondary">{source}</span>
            <span className="min-w-0 truncate text-text-muted">{message}</span>
        </div>
    )
}
