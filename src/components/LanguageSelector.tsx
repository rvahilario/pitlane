import { Globe, Check, ChevronDown } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { LANGUAGES, setLanguage, type Language } from '@/i18n'
import { cn } from '@/lib/cn'
import { Dropdown } from '@/components/ui'

const LABELS: Record<Language, string> = {
    'pt-BR': 'Português (BR)',
    en: 'English',
}

const SHORT: Record<Language, string> = {
    'pt-BR': 'PT',
    en: 'EN',
}

interface LanguageSelectorProps {
    variant?: 'default' | 'compact'
}

export function LanguageSelector({ variant = 'default' }: LanguageSelectorProps) {
    const { i18n } = useTranslation()
    const current = i18n.language as Language

    return (
        <Dropdown
            trigger={(open) => (
                <button className="flex items-center gap-1 text-text-muted hover:text-text-secondary transition-colors">
                    <Globe
                        className={cn(
                            'shrink-0',
                            variant === 'compact' ? 'w-3 h-3' : 'w-3.5 h-3.5',
                        )}
                    />
                    <span className="text-xs">
                        {variant === 'compact' ? SHORT[current] : LABELS[current]}
                    </span>
                    <ChevronDown
                        className={cn('w-3 h-3 transition-transform', open && 'rotate-180')}
                    />
                </button>
            )}
        >
            {LANGUAGES.map((lang) => (
                <button
                    key={lang}
                    onClick={() => setLanguage(lang)}
                    className={cn(
                        'w-full flex items-center justify-between px-3 py-1.5 text-xs text-left transition-colors',
                        lang === current
                            ? 'text-accent bg-accent/10'
                            : 'text-text-muted hover:text-text hover:bg-surface',
                    )}
                >
                    {LABELS[lang]}
                    {lang === current && <Check className="w-3 h-3 shrink-0" />}
                </button>
            ))}
        </Dropdown>
    )
}
