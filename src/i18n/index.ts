import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import ptBR from "./locales/pt-BR.json";
import en from "./locales/en.json";

export const LANGUAGES = ["pt-BR", "en"] as const;
export type Language = (typeof LANGUAGES)[number];

const saved = localStorage.getItem("pitlane_lang") as Language | null;
const browserLang = navigator.language.startsWith("pt") ? "pt-BR" : "en";
const defaultLang: Language = saved ?? browserLang;

i18n.use(initReactI18next).init({
  resources: {
    "pt-BR": { translation: ptBR },
    en:      { translation: en },
  },
  lng: defaultLang,
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export function setLanguage(lang: Language) {
  i18n.changeLanguage(lang);
  localStorage.setItem("pitlane_lang", lang);
}

export default i18n;
