import {useEffect, useState} from 'react';
import {Moon, Sun} from '~/components/Icons';

export const THEME_STORAGE_KEY = 'estsa-theme';

/**
 * Inline script for <head>: applies the saved theme to <html data-theme>
 * before first paint so light-mode visitors don't see a dark flash.
 * Dark is the default.
 */
export const THEME_INIT_SCRIPT = `try{document.documentElement.dataset.theme=localStorage.getItem('${THEME_STORAGE_KEY}')==='light'?'light':'dark'}catch(e){}`;

/**
 * Light/dark switch. The initial theme is applied to <html data-theme> by
 * THEME_INIT_SCRIPT in root.jsx; this component only syncs with it and
 * persists the choice.
 */
export function ThemeToggle() {
  const [isDark, setIsDark] = useState(true);

  useEffect(() => {
    setIsDark(document.documentElement.dataset.theme !== 'light');
  }, []);

  function toggle() {
    const next = isDark ? 'light' : 'dark';
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem(THEME_STORAGE_KEY, next);
    } catch {
      // Storage can be unavailable (private mode); the toggle still works.
    }
    setIsDark(!isDark);
  }

  return (
    <button
      aria-checked={isDark}
      aria-label="Modo oscuro"
      className="theme-toggle"
      onClick={toggle}
      role="switch"
      type="button"
    >
      <Sun className="sun" size={18} />
      <span className="theme-toggle-track">
        <span className="theme-toggle-knob" />
      </span>
      <Moon className="moon" size={17} />
    </button>
  );
}
