'use client';

import { useServerInsertedHTML } from 'next/navigation';

export function ThemeScript() {
  useServerInsertedHTML(() => {
    return (
      <script
        id="theme-toggle"
        dangerouslySetInnerHTML={{
          __html: `
            (() => {
              try {
                const key = 'cbt-color-mode';
                const stored = window.localStorage.getItem(key);
                const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                const mode = stored === 'dark' || (!stored && prefersDark) ? 'dark' : 'light';
                document.documentElement.classList.toggle('dark', mode === 'dark');
                document.documentElement.style.colorScheme = mode;
              } catch (e) {}
            })();
          `,
        }}
      />
    );
  });
  return null;
}
