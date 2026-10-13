export type ThemePref = "system" | "light" | "dark";

export const THEME_STORAGE_KEY = "theme";
const ORDER: ThemePref[] = ["system", "light", "dark"];

export function nextThemePref(pref: ThemePref): ThemePref {
  return ORDER[(ORDER.indexOf(pref) + 1) % ORDER.length];
}

export function readThemePref(): ThemePref {
  try {
    const value = localStorage.getItem(THEME_STORAGE_KEY);
    if (value === "light" || value === "dark") return value;
  } catch {}
  return "system";
}

export function applyThemePref(pref: ThemePref) {
  const root = document.documentElement;
  root.setAttribute("data-theme-pref", pref);
  if (pref === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", pref);
}

export function saveThemePref(pref: ThemePref) {
  try {
    if (pref === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, pref);
  } catch {}
  applyThemePref(pref);
}

// Runs synchronously while the HTML is parsed, before the first paint.
export const themeInitScript = `(function(){var p="system";try{var v=localStorage.getItem("${THEME_STORAGE_KEY}");if(v==="light"||v==="dark")p=v}catch(e){}var r=document.documentElement;r.setAttribute("data-theme-pref",p);if(p!=="system")r.setAttribute("data-theme",p)})()`;
