import pitlaneIcon from '@/assets/pitlane-icon.png'
import { cn } from '@/lib/cn'

interface PitlaneLogoProps {
    className?: string
}

export function PitlaneLogo({ className }: PitlaneLogoProps) {
    return (
        <div className={cn('flex items-center gap-3', className)}>
            <img
                src={pitlaneIcon}
                alt=""
                aria-hidden="true"
                data-testid="pitlane-logo-icon"
                className="h-9 w-9 shrink-0 object-contain"
            />
            <span className="flex flex-col select-none">
                <span className="text-2xl font-bold uppercase leading-none text-text">Pitlane</span>
                <span className="mt-1 text-xs font-medium uppercase leading-none text-text-muted">
                    Companion app manager
                </span>
            </span>
        </div>
    )
}
