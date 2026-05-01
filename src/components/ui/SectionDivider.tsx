interface SectionDividerProps {
    title: string
}

export function SectionDivider({ title }: SectionDividerProps) {
    return (
        <div className="flex items-center gap-2 pt-1">
            <span className="text-xs font-semibold uppercase tracking-widest text-text-muted">
                {title}
            </span>
            <div className="flex-1 h-px bg-border" />
        </div>
    )
}
