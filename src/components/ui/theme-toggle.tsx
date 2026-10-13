"use client";

import { Monitor, Moon, Sun } from "lucide-react";
import { useLayoutEffect } from "react";
import { applyThemePref, nextThemePref, readThemePref, saveThemePref } from "@/lib/theme";

/** Cycles system → light → dark. The visible icon is chosen by CSS from <html data-theme-pref>. */
export function ThemeToggle() {
  // React resets <html> attributes on the dev Strict Mode remount; re-apply (no-op in production).
  useLayoutEffect(() => {
    applyThemePref(readThemePref());
  }, []);

  return (
    <button
      type="button"
      aria-label="Сменить тему: системная, светлая, тёмная"
      onClick={() => saveThemePref(nextThemePref(readThemePref()))}
      className="inline-flex size-touch items-center justify-center rounded-pill transition-colors hover:bg-fg/10"
    >
      <Monitor className="theme-icon size-5" data-pref="system" aria-hidden="true" />
      <Sun className="theme-icon size-5" data-pref="light" aria-hidden="true" />
      <Moon className="theme-icon size-5" data-pref="dark" aria-hidden="true" />
    </button>
  );
}
