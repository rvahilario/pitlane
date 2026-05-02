import { ChevronDown, CircleUserRound } from 'lucide-react'
import { LanguageSelector } from '@/components/LanguageSelector'
import { PitlaneLogo } from '@/components/PitlaneLogo'
import { ThemeSelector } from '@/components/ThemeSelector'

interface TopBarProps {
    activeProfileName?: string | null
    profileLabel: string
}

export function TopBar({ activeProfileName, profileLabel }: TopBarProps) {
    return (
        <header className="flex h-shell-topbar shrink-0 items-center justify-between border-b border-border bg-canvas py-1 px-8">
            <PitlaneLogo />

            <div className="flex min-w-0 items-center gap-4">
                <div className="hidden items-center gap-4 rounded-lg border border-border bg-surface px-4 py-1 sm:flex">
                    <CircleUserRound className="h-5 w-5 shrink-0 text-text-secondary" />
                    <div className="min-w-0">
                        <span className="block max-w-44 truncate text-sm font-semibold text-text">
                            {activeProfileName ?? '...'}
                        </span>
                        <span className="mt-0.5 block text-xs font-medium text-accent">
                            {profileLabel}
                        </span>
                    </div>
                    <ChevronDown className="h-4 w-4 shrink-0 text-text-muted" />
                </div>

                <div className="h-9 w-px bg-border" />

                <ThemeSelector variant="compact" />
                <LanguageSelector variant="compact" />
            </div>
        </header>
    )
}
