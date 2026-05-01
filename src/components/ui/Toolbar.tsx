import { cn } from '@/lib/cn'

interface ToolbarProps extends React.HTMLAttributes<HTMLDivElement> {
    align?: 'start' | 'end' | 'between'
}

const alignClass: Record<NonNullable<ToolbarProps['align']>, string> = {
    start: 'justify-start',
    end: 'justify-end',
    between: 'justify-between',
}

export function Toolbar({ align = 'end', className, ...props }: ToolbarProps) {
    return (
        <div
            role="toolbar"
            className={cn('flex flex-wrap items-center gap-2', alignClass[align], className)}
            {...props}
        />
    )
}
