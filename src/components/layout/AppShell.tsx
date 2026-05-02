import { cn } from '@/lib/cn'

interface AppShellProps {
    topBar: React.ReactNode
    sidebar: React.ReactNode
    bottomBar?: React.ReactNode
    children: React.ReactNode
    className?: string
}

export function AppShell({ topBar, sidebar, bottomBar, children, className }: AppShellProps) {
    return (
        <div className={cn('flex h-screen flex-col overflow-hidden bg-canvas', className)}>
            {topBar}
            <div className="flex min-h-0 flex-1">
                {sidebar}
                <main className="min-w-0 flex-1 overflow-hidden">{children}</main>
            </div>
            {bottomBar}
        </div>
    )
}
