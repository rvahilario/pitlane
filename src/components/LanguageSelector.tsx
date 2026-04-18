import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LANGUAGES, setLanguage, type Language } from "@/i18n";
import { cn } from "@/lib/cn";

interface LanguageSelectorProps {
  variant?: "pills" | "compact";
}

export function LanguageSelector({ variant = "pills" }: LanguageSelectorProps) {
  const { i18n } = useTranslation();
  const current = i18n.language as Language;

  if (variant === "compact") {
    return (
      <div className="flex items-center gap-1">
        <Globe className="w-3.5 h-3.5 text-text-muted shrink-0" />
        {LANGUAGES.map((lang) => (
          <button
            key={lang}
            onClick={() => setLanguage(lang)}
            className={cn(
              "text-xs px-1.5 py-0.5 rounded transition-colors",
              current === lang
                ? "text-accent font-semibold"
                : "text-text-disabled hover:text-text-muted",
            )}
          >
            {lang === "pt-BR" ? "PT" : "EN"}
          </button>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-1.5">
      {LANGUAGES.map((lang) => (
        <button
          key={lang}
          onClick={() => setLanguage(lang)}
          className={cn(
            "px-3 py-1.5 text-xs rounded border transition-colors",
            current === lang
              ? "bg-accent/15 border-accent/40 text-accent font-semibold"
              : "border-border-strong text-text-muted hover:border-elevated hover:text-text-secondary",
          )}
        >
          {lang === "pt-BR" ? "Português (BR)" : "English"}
        </button>
      ))}
    </div>
  );
}
