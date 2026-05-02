interface FormFieldProps {
    label: string
    hint?: string
    id?: string
    error?: string
    children: React.ReactNode
}

export function FormField({ label, hint, id, error, children }: FormFieldProps) {
    return (
        <div className="flex flex-col gap-1">
            <label htmlFor={id} className="text-xs text-text-muted">
                {label}
            </label>
            {children}
            {hint && <p className="text-xs text-text-muted">{hint}</p>}
            {error && (
                <p role="alert" className="text-xs text-danger">
                    {error}
                </p>
            )}
        </div>
    )
}
