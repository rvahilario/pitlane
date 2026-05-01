import { Gauge, LayoutList, ScrollText, Settings } from 'lucide-react'

export const TAB_IDS = ['command', 'apps', 'logs', 'settings'] as const
export type Tab = (typeof TAB_IDS)[number]

export const DEFAULT_TAB: Tab = 'command'

export const NAV_ITEMS = [
    { id: 'command', labelKey: 'nav.command', icon: Gauge },
    { id: 'apps', labelKey: 'nav.apps', icon: LayoutList },
    { id: 'logs', labelKey: 'nav.logs', icon: ScrollText },
    { id: 'settings', labelKey: 'nav.settings', icon: Settings },
] as const satisfies ReadonlyArray<{
    id: Tab
    labelKey: string
    icon: React.ElementType
}>
