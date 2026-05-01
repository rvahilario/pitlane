import type { LucideIcon } from 'lucide-react'

interface EmptyStateProps {
    icon: LucideIcon
    message: string
    action?: React.ReactNode
}

export function EmptyState({ icon: Icon, message, action }: EmptyStateProps) {
    return (
        <div className="flex-1 flex flex-col items-center justify-center text-text-muted gap-3 h-full">
            <Icon className="w-8 h-8" />
            <div className="flex flex-col items-center gap-2">
                <p className="text-sm">{message}</p>
                {action}
            </div>
        </div>
    )
}
