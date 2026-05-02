import { Gauge, LayoutList, ScrollText, Settings } from 'lucide-react'

export const TAB_IDS = ['command', 'apps', 'logs', 'settings'] as const
export type Tab = (typeof TAB_IDS)[number]

export const TAB = {
    COMMAND: 'command',
    APPS: 'apps',
    LOGS: 'logs',
    SETTINGS: 'settings',
} as const satisfies Record<string, Tab>

export const DEFAULT_TAB: Tab = TAB.COMMAND

export const NAV_ITEMS = [
    { id: TAB.COMMAND, labelKey: 'nav.command', icon: Gauge },
    { id: TAB.APPS, labelKey: 'nav.apps', icon: LayoutList },
    { id: TAB.LOGS, labelKey: 'nav.logs', icon: ScrollText },
    { id: TAB.SETTINGS, labelKey: 'nav.settings', icon: Settings },
] as const satisfies ReadonlyArray<{
    id: Tab
    labelKey: string
    icon: React.ElementType
}>
