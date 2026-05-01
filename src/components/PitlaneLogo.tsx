import pitlaneIcon from '@/assets/pitlane-icon.png'
import { cn } from '@/lib/cn'

interface PitlaneLogoProps {
    className?: string
}

export function PitlaneLogo({ className }: PitlaneLogoProps) {
    return (
        <div className={cn('flex items-center gap-2.5', className)}>
            <img
                src={pitlaneIcon}
                alt=""
                aria-hidden="true"
                data-testid="pitlane-logo-icon"
                className="h-6 w-6 shrink-0 object-contain"
            />
            <span className="text-sm font-semibold tracking-[0.16em] uppercase text-text select-none">
                Pitlane
            </span>
        </div>
    )
}
