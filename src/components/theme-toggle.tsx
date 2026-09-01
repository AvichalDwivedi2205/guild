'use client';

import { Moon, Sun } from 'lucide-react';
import { useSyncExternalStore } from 'react';

type GuildTheme = 'dark' | 'light';
const themeEvent = 'guild-theme-change';

function subscribeTheme(listener: () => void) {
  window.addEventListener(themeEvent, listener);
  return () => window.removeEventListener(themeEvent, listener);
}

function currentTheme(): GuildTheme {
  return document.documentElement.dataset.theme === 'light' ? 'light' : 'dark';
}

function applyTheme(theme: GuildTheme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
  window.dispatchEvent(new Event(themeEvent));
}

export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const theme = useSyncExternalStore(subscribeTheme, currentTheme, () => 'dark');
  const nextTheme = theme === 'dark' ? 'light' : 'dark';
  return (
    <button
      className="theme-toggle"
      type="button"
      aria-label={`Use ${nextTheme} theme`}
      title={`Use ${nextTheme} theme`}
      data-compact={compact || undefined}
      onClick={() => applyTheme(nextTheme)}
    >
      {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
    </button>
  );
}
