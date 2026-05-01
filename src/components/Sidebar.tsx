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
        <nav className="flex flex-col gap-1 w-44 shrink-0 bg-base border-r border-border p-2">
            {NAV_ITEMS.map(({ id, labelKey, icon: Icon }) => (
                <button
                    key={id}
                    data-testid={`nav-${id}`}
                    aria-current={active === id ? 'page' : undefined}
                    onClick={() => onChange(id)}
                    className={cn(
                        'flex items-center gap-2.5 px-3 py-2 rounded text-sm font-medium transition-colors text-left w-full border',
                        active === id
                            ? 'bg-elevated text-text border-accent'
                            : 'text-text-muted hover:text-text hover:bg-surface border-transparent',
                    )}
                >
                    <Icon
                        className={cn(
                            'w-4 h-4 shrink-0 transition-colors',
                            active === id ? 'text-accent' : '',
                        )}
                    />
                    {t(labelKey)}
                </button>
            ))}
        </nav>
    )
}
