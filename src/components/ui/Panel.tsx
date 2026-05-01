import { cn } from '@/lib/cn'

interface PanelProps extends React.HTMLAttributes<HTMLElement> {
    as?: 'section' | 'div' | 'article'
}

export function Panel({ as: Component = 'section', className, ...props }: PanelProps) {
    return (
        <Component
            className={cn('rounded-lg border border-border bg-surface text-text', className)}
            {...props}
        />
    )
}

interface PanelHeaderProps extends Omit<React.HTMLAttributes<HTMLDivElement>, 'title'> {
    title: React.ReactNode
    description?: React.ReactNode
    action?: React.ReactNode
}

export function PanelHeader({ title, description, action, className, ...props }: PanelHeaderProps) {
    return (
        <div
            className={cn(
                'flex min-h-12 items-center justify-between gap-3 border-b border-border px-4 py-3',
                className,
            )}
            {...props}
        >
            <div className="min-w-0">
                <h2 className="truncate text-sm font-semibold text-text">{title}</h2>
                {description && <p className="mt-0.5 text-xs text-text-muted">{description}</p>}
            </div>
            {action && <div className="shrink-0">{action}</div>}
        </div>
    )
}
