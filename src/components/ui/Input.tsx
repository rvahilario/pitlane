import { cn } from '@/lib/cn'

const inputBase =
    'text-sm bg-elevated border border-border-strong rounded-md px-3 py-1.5 text-text outline-none focus:border-accent placeholder:text-text-disabled transition-colors'

interface TextInputProps {
    id?: string
    value: string
    onChange: (v: string) => void
    placeholder?: string
    mono?: boolean
}

export function TextInput({ id, value, onChange, placeholder, mono = false }: TextInputProps) {
    return (
        <input
            id={id}
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={placeholder}
            className={cn(inputBase, mono && 'font-mono text-xs')}
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
