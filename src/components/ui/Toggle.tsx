import { cn } from "@/lib/cn";

interface ToggleProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  disabled?: boolean;
}

export function Toggle({ checked, onChange, label, disabled = false }: ToggleProps) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      disabled={disabled}
      onClick={() => { if (!disabled) onChange(!checked); }}
      className={cn(
        "flex h-5 w-9 items-center rounded-full p-0.5 transition-colors shrink-0 disabled:cursor-not-allowed",
        disabled
          ? "border border-border bg-elevated"
          : checked
            ? "bg-accent-solid hover:bg-accent-solid-hover"
            : "border border-accent-solid bg-elevated hover:bg-surface",
      )}
    >
      <span
        className={cn(
          "h-4 w-4 rounded-full transition-transform",
          disabled
            ? "translate-x-0 bg-text-disabled"
            : checked
              ? "translate-x-4 bg-on-accent"
              : "translate-x-0 bg-accent-solid",
        )}
      />
    </button>
  );
}
