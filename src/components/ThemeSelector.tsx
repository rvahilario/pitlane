import { Check, ChevronDown, Palette } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { THEMES, getTheme, setTheme, type Theme } from "@/theme";
import { cn } from "@/lib/cn";

interface ThemeSelectorProps {
  variant?: "default" | "compact";
}

const SHORT: Record<Theme, string> = {
  "pitlane-aurora": "Aurora",
  "pitlane-nebula": "Nebula",
};

export function ThemeSelector({ variant = "default" }: ThemeSelectorProps) {
  const { t } = useTranslation();
  const [current, setCurrent] = useState<Theme>(() => getTheme());
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleThemeChange(e: Event) {
      setCurrent((e as CustomEvent<Theme>).detail);
    }

    window.addEventListener("pitlane:theme-change", handleThemeChange);
    return () => window.removeEventListener("pitlane:theme-change", handleThemeChange);
  }, []);

  useEffect(() => {
    if (!open) return;
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-text-muted hover:text-text-secondary transition-colors"
      >
        <Palette className={cn("shrink-0", variant === "compact" ? "w-3 h-3" : "w-3.5 h-3.5")} />
        <span className="text-xs">
          {variant === "compact" ? SHORT[current] : t(`settings.themes.${current}`)}
        </span>
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 z-50 bg-elevated border border-border-strong rounded-lg shadow-xl min-w-[168px] py-1 overflow-hidden">
          {THEMES.map((theme) => (
            <button
              key={theme}
              type="button"
              onClick={() => { setTheme(theme); setOpen(false); }}
              className={cn(
                "w-full flex items-center justify-between gap-3 px-3 py-1.5 text-xs text-left transition-colors",
                theme === current
                  ? "text-accent bg-accent/10"
                  : "text-text-muted hover:text-text hover:bg-surface",
              )}
            >
              {t(`settings.themes.${theme}`)}
              {theme === current && <Check className="w-3 h-3 shrink-0" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
