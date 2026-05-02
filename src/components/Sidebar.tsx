import { useTranslation } from 'react-i18next'
import { cn } from '@/lib/cn'
import { NAV_ITEMS, type Tab } from './navigation'

interface SidebarProps {
    active: Tab
    onChange: (tab: Tab) => void
}

export function Sidebar({ active, onChange }: SidebarProps) {
    const { t } = useTranslation()

    return (
        <aside className="flex w-shell-sidebar shrink-0 flex-col rounded-lg border border-border bg-base p-4">
            <nav className="flex flex-col gap-2">
                {NAV_ITEMS.map(({ id, labelKey, icon: Icon }) => (
                    <button
                        key={id}
                        data-testid={`nav-${id}`}
                        aria-current={active === id ? 'page' : undefined}
                        onClick={() => onChange(id)}
                        className={cn(
                            'flex min-h-12 w-full items-center gap-4 rounded-lg border px-4 py-1 text-left text-body-ui font-medium transition-colors',
                            active === id
                                ? 'border-accent bg-elevated text-accent shadow-[0_0_24px_rgba(77,217,208,0.10)]'
                                : 'border-transparent text-text-secondary hover:border-border hover:bg-surface hover:text-text',
                        )}
                    >
                        <Icon
                            className={cn(
                                'h-6 w-6 shrink-0 stroke-[1.8] transition-colors',
                                active === id ? 'text-accent' : 'text-text-secondary',
                            )}
                        />
                        {t(labelKey)}
                    </button>
                ))}
            </nav>

            <div className="mt-auto space-y-4">
                <div className="rounded-lg border border-border bg-surface px-4 py-3">
                    <div className="flex items-center gap-3">
                        <span className="h-2.5 w-2.5 rounded-full bg-success" />
                        <span className="text-sm uppercase text-text-muted">Pitlane service</span>
                    </div>
                    <p className="pl-5 mt-1 text-sm font-semibold text-success">Connected</p>
                    <p className="pl-5 mt-1 text-xs text-text-muted">v{__APP_VERSION__}</p>
                </div>
            </div>
        </aside>
    )
}
