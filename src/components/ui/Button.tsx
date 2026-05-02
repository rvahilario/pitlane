import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/cn'

const button = cva(
    'inline-flex items-center justify-center gap-1.5 font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed [&_svg]:shrink-0',
    {
        variants: {
            variant: {
                accent: 'rounded-md border border-accent-solid bg-accent-solid text-on-accent hover:bg-accent-solid-hover',
                success:
                    'rounded-md border border-success-solid bg-success-solid text-on-success hover:bg-success-solid-hover',
                danger: 'rounded-md border border-danger-solid bg-danger-solid text-on-danger hover:bg-danger-solid-hover',
                ghost: 'rounded-md border border-border-strong text-text-muted hover:text-text hover:bg-elevated',
                icon: 'rounded p-1.5 text-text-secondary hover:text-text hover:bg-elevated',
            },
            size: {
                sm: 'px-2.5 py-1 text-sm [&_svg]:h-4 [&_svg]:w-4',
                md: 'px-3 py-1.5 text-md [&_svg]:h-5 [&_svg]:w-5',
            },
        },
        defaultVariants: {
            variant: 'accent',
            size: 'md',
        },
        compoundVariants: [
            { variant: 'icon', size: 'sm', class: 'px-1 py-1' },
            { variant: 'icon', size: 'md', class: 'p-1.5' },
        ],
    },
)

export interface ButtonProps
    extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof button> {}

export function Button({ variant, size, className, ...props }: ButtonProps) {
    return <button className={cn(button({ variant, size }), className)} {...props} />
}
