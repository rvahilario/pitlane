import { Globe } from "lucide-react";
import { useTranslation } from "react-i18next";
import { LANGUAGES, setLanguage, type Language } from "@/i18n";
import { cn } from "@/lib/cn";

interface LanguageSelectorProps {
  variant?: "default" | "compact";
}

const LANGUAGE_LABELS: Record<Language, string> = {
  "pt-BR": "Português (BR)",
  "en":    "English",
};

export function LanguageSelector({ variant = "default" }: LanguageSelectorProps) {
  const { i18n } = useTranslation();
  const current = i18n.language as Language;

  return (
    <div className={cn("flex items-center gap-1.5", variant === "compact" && "gap-1")}>
      <Globe className={cn(
        "shrink-0 text-text-muted",
        variant === "compact" ? "w-3 h-3" : "w-3.5 h-3.5",
      )} />
      <select
        value={current}
        onChange={(e) => setLanguage(e.target.value as Language)}
        className={cn(
          "bg-transparent text-text-muted hover:text-text-secondary cursor-pointer",
          "border-none outline-none appearance-none transition-colors",
          "focus:text-text",
          variant === "compact" ? "text-xs" : "text-xs py-1",
        )}
      >
        {LANGUAGES.map((lang) => (
          <option key={lang} value={lang} className="bg-canvas text-text">
            {variant === "compact" ? lang : LANGUAGE_LABELS[lang]}
          </option>
        ))}
      </select>
    </div>
  );
}
