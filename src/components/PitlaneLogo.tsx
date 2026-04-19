import { cn } from "@/lib/cn";

interface PitlaneLogoProps {
  className?: string;
}

export function PitlaneLogo({ className }: PitlaneLogoProps) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        fill="none"
        aria-hidden="true"
        className="shrink-0"
      >
        <rect x="0"  y="0"  width="9" height="9" rx="1.5" fill="var(--color-accent)" />
        <rect x="11" y="0"  width="9" height="9" rx="1.5" fill="var(--color-accent)" fillOpacity="0.22" />
        <rect x="0"  y="11" width="9" height="9" rx="1.5" fill="var(--color-accent)" fillOpacity="0.22" />
        <rect x="11" y="11" width="9" height="9" rx="1.5" fill="var(--color-accent)" />
      </svg>
      <span className="text-sm font-semibold tracking-[0.16em] uppercase text-text select-none">
        Pitlane
      </span>
    </div>
  );
}
