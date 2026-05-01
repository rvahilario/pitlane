import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const metricTile = cva('rounded-lg border bg-surface px-3 py-2.5', {
    variants: {
        variant: {
            neutral: 'border-border text-text',
            accent: 'border-accent/40 text-accent',
            success: 'border-success/40 text-success',
            warning: 'border-warning/45 text-warning',
            danger: 'border-danger/45 text-danger',
        },
    },
    defaultVariants: {
        variant: 'neutral',
    },
})

export interface MetricTileProps
    extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof metricTile> {
    label: React.ReactNode
    value: React.ReactNode
    icon?: React.ElementType
}

export function MetricTile({
    label,
    value,
    icon: Icon,
    variant,
    className,
    ...props
}: MetricTileProps) {
    return (
        <div className={cn(metricTile({ variant }), className)} {...props}>
            <div className="flex items-center gap-2">
                {Icon && <Icon className="h-4 w-4 shrink-0 stroke-[2.5]" aria-hidden="true" />}
                <span className="text-xs font-medium text-text-muted">{label}</span>
            </div>
            <p className="mt-1 text-lg font-semibold leading-none text-current">{value}</p>
        </div>
    )
}
