import { LanguageSelector } from '@/components/LanguageSelector'
import { PitlaneLogo } from '@/components/PitlaneLogo'
import { ThemeSelector } from '@/components/ThemeSelector'

interface TopBarProps {
    activeProfileName?: string | null
    profileLabel: string
}

export function TopBar({ activeProfileName, profileLabel }: TopBarProps) {
    return (
        <header className="flex h-12 shrink-0 items-center justify-between border-b border-border bg-canvas px-4">
            <PitlaneLogo />

            <div className="flex min-w-0 items-center gap-3">
                <div className="hidden min-w-0 items-center gap-2 rounded-md border border-border bg-surface px-2.5 py-1.5 sm:flex">
                    <span className="text-xs font-medium text-text-muted">{profileLabel}</span>
                    <span className="max-w-40 truncate text-xs font-semibold text-text-secondary">
                        {activeProfileName ?? '...'}
                    </span>
                </div>

                <div className="h-4 w-px bg-border" />

                <ThemeSelector variant="compact" />
                <LanguageSelector variant="compact" />
            </div>
        </header>
    )
}
