import { cn } from "@/lib/cn";

const AVATAR_COLORS = [
  "bg-accent/20 text-accent",
  "bg-success/20 text-success",
  "bg-warning/20 text-warning",
  "bg-danger/20 text-danger",
];

interface AppAvatarProps {
  name: string;
  iconUrl?: string;
}

export function AppAvatar({ name, iconUrl }: AppAvatarProps) {
  if (iconUrl) {
    return (
      <img
        src={iconUrl}
        alt={name}
        className="w-8 h-8 rounded-lg shrink-0 select-none object-contain"
      />
    );
  }

  const idx = (name.charCodeAt(0) ?? 0) % AVATAR_COLORS.length;
  return (
    <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 select-none", AVATAR_COLORS[idx])}>
      {name[0]?.toUpperCase() ?? "?"}
    </div>
  );
}
