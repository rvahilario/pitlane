import { Check, ChevronDown, Palette } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { THEMES, getTheme, setTheme, type Theme } from '@/theme'
import { cn } from '@/lib/cn'
import { Dropdown } from '@/components/ui/Dropdown'

interface ThemeSelectorProps {
    variant?: 'default' | 'compact'
}

const SHORT: Record<Theme, string> = {
    'pitlane-aurora': 'Aurora',
    'pitlane-nebula': 'Nebula',
}

export function ThemeSelector({ variant = 'default' }: ThemeSelectorProps) {
    const { t } = useTranslation()
    const [current, setCurrent] = useState<Theme>(() => getTheme())

    useEffect(() => {
        function handleThemeChange(e: Event) {
            setCurrent((e as CustomEvent<Theme>).detail)
        }
        window.addEventListener('pitlane:theme-change', handleThemeChange)
        return () => window.removeEventListener('pitlane:theme-change', handleThemeChange)
    }, [])

    return (
        <Dropdown
            trigger={(open) => (
                <button
                    type="button"
                    className="flex items-center gap-1 text-text-muted hover:text-text-secondary transition-colors"
                >
                    <Palette
                        className={cn(
                            'shrink-0',
                            variant === 'compact' ? 'w-3 h-3' : 'w-3.5 h-3.5',
                        )}
                    />
                    <span className="text-xs">
                        {variant === 'compact' ? SHORT[current] : t(`settings.themes.${current}`)}
                    </span>
                    <ChevronDown
                        className={cn('w-3 h-3 transition-transform', open && 'rotate-180')}
                    />
                </button>
            )}
        >
            {THEMES.map((theme) => (
                <button
                    key={theme}
                    type="button"
                    onClick={() => setTheme(theme)}
                    className={cn(
                        'w-full flex items-center justify-between gap-3 px-3 py-1.5 text-xs text-left transition-colors',
                        theme === current
                            ? 'text-accent bg-accent/10'
                            : 'text-text-muted hover:text-text hover:bg-surface',
                    )}
                >
                    {t(`settings.themes.${theme}`)}
                    {theme === current && <Check className="w-3 h-3 shrink-0" />}
                </button>
            ))}
        </Dropdown>
    )
}
