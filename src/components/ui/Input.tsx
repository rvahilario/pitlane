import { cn } from '@/lib/cn'

const inputBase =
    'text-sm bg-elevated border border-border-strong rounded-md px-3 py-1.5 text-text outline-none focus:border-accent placeholder:text-text-disabled transition-colors'

interface TextInputProps {
    id?: string
    value: string
    onChange: (v: string) => void
    placeholder?: string
    mono?: boolean
    'aria-invalid'?: boolean
    onBlur?: () => void
}

export function TextInput({
    id,
    value,
    onChange,
    placeholder,
    mono = false,
    'aria-invalid': ariaInvalid,
    onBlur,
}: TextInputProps) {
    return (
        <input
            id={id}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onBlur={onBlur}
            placeholder={placeholder}
            aria-invalid={ariaInvalid}
            className={cn(inputBase, mono && 'font-mono text-xs', ariaInvalid && 'border-danger')}
        />
    )
}

interface NumberInputProps {
    id?: string
    value: number
    onChange: (v: number) => void
    min?: number
    step?: number
    className?: string
}

export function NumberInput({
    id,
    value,
    onChange,
    min = 0,
    step = 1,
    className,
}: NumberInputProps) {
    return (
        <input
            id={id}
            type="number"
            value={value}
            onChange={(e) => onChange(Number(e.target.value))}
            min={min}
            step={step}
            className={cn(inputBase, 'w-28', className)}
        />
    )
}
