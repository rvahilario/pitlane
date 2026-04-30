export const THEMES = ["pitlane-aurora", "pitlane-nebula"] as const;
export type Theme = (typeof THEMES)[number];

const STORAGE_KEY = "pitlane_theme";
const DEFAULT_THEME: Theme = "pitlane-aurora";

function isTheme(value: string | null): value is Theme {
  return THEMES.includes(value as Theme);
}

export function getTheme(): Theme {
  const saved = localStorage.getItem(STORAGE_KEY);
  return isTheme(saved) ? saved : DEFAULT_THEME;
}

export function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
}

export function setTheme(theme: Theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
  window.dispatchEvent(new CustomEvent<Theme>("pitlane:theme-change", { detail: theme }));
}

applyTheme(getTheme());
