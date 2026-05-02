import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const iconButton = cva(
    'inline-flex min-h-11 min-w-11 items-center justify-center rounded-md border transition-colors disabled:cursor-not-allowed disabled:opacity-50 [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                ghost: 'border-transparent text-text-secondary hover:bg-elevated hover:text-text',
                secondary:
                    'border-border-strong text-text-secondary hover:bg-elevated hover:text-text',
                danger: 'border-danger text-danger hover:bg-danger/10',
                accent: 'border-accent-solid text-accent hover:bg-accent/10',
            },
            size: {
                sm: 'h-11 w-11 [&_svg]:h-6 [&_svg]:w-6',
                md: 'h-12 w-12 [&_svg]:h-6 [&_svg]:w-6',
            },
        },
        defaultVariants: {
            variant: 'ghost',
            size: 'sm',
        },
    },
)

export interface IconButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof iconButton> {
    'aria-label': string
}

export function IconButton({
    variant,
    size,
    className,
    type = 'button',
    ...props
}: IconButtonProps) {
    return (
        <button type={type} className={cn(iconButton({ variant, size }), className)} {...props} />
    )
}
