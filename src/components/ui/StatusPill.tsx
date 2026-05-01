import { Activity, AlertTriangle, Ban, CheckCircle2, Circle, Wifi, WifiOff } from 'lucide-react'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const statusPill = cva(
    'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs font-medium',
    {
        variants: {
            variant: {
                online: 'border-accent/40 bg-accent/10 text-accent',
                offline: 'border-border-strong bg-surface text-text-muted',
                running: 'border-success/40 bg-success/10 text-success',
                idle: 'border-border-strong bg-surface text-text-secondary',
                crashed: 'border-warning/45 bg-warning/10 text-warning',
                disabled: 'border-border bg-surface-disabled text-text-muted',
                warning: 'border-warning/45 bg-warning/10 text-warning',
            },
        },
        defaultVariants: {
            variant: 'idle',
        },
    },
)

type StatusPillVariant = NonNullable<VariantProps<typeof statusPill>['variant']>

const ICONS: Record<StatusPillVariant, React.ElementType> = {
    online: Wifi,
    offline: WifiOff,
    running: Activity,
    idle: Circle,
    crashed: AlertTriangle,
    disabled: Ban,
    warning: AlertTriangle,
}

export interface StatusPillProps
    extends React.HTMLAttributes<HTMLSpanElement>, VariantProps<typeof statusPill> {
    children: React.ReactNode
    icon?: React.ElementType
}

export function StatusPill({
    variant = 'idle',
    icon,
    children,
    className,
    ...props
}: StatusPillProps) {
    const resolvedVariant: StatusPillVariant = variant ?? 'idle'
    const Icon = icon ?? ICONS[resolvedVariant] ?? CheckCircle2

    return (
        <span className={cn(statusPill({ variant: resolvedVariant }), className)} {...props}>
            <Icon className="h-3.5 w-3.5 shrink-0 stroke-[2.5]" aria-hidden="true" />
            {children}
        </span>
    )
}
