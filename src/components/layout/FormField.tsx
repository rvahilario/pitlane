interface FormFieldProps {
    label: string
    hint?: string
    id?: string
    children: React.ReactNode
}

export function FormField({ label, hint, id, children }: FormFieldProps) {
    return (
        <div className="flex flex-col gap-1">
            <label htmlFor={id} className="text-xs text-text-muted">
                {label}
            </label>
            {children}
            {hint && <p className="text-xs text-text-muted">{hint}</p>}
        </div>
    )
}
