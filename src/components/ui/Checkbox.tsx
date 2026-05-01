import { Check } from 'lucide-react'
import { cn } from '@/lib/cn'

interface CheckboxProps {
    label: string
    hint?: string
    checked: boolean
    onChange: (v: boolean) => void
}

export function Checkbox({ label, hint, checked, onChange }: CheckboxProps) {
    return (
        <label className="flex items-start gap-2.5 cursor-pointer group">
            <div
                className={cn(
                    'mt-0.5 w-4 h-4 rounded border shrink-0 flex items-center justify-center transition-colors',
                    checked
                        ? 'border-accent-solid bg-accent-solid'
                        : 'border-border-strong bg-elevated group-hover:border-accent/50',
                )}
            >
                <input
                    type="checkbox"
                    checked={checked}
                    onChange={(e) => onChange(e.target.checked)}
                    className="sr-only"
                />
                {checked && <Check className="w-3 h-3 text-on-accent stroke-[2.5]" />}
            </div>
            <div>
                <p className="text-sm text-text leading-tight">{label}</p>
                {hint && <p className="text-xs text-text-muted mt-0.5">{hint}</p>}
            </div>
        </label>
    )
}
