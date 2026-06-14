import { createSystem, defaultConfig, defineConfig } from '@chakra-ui/react';

/**
 * CBT Enterprise Design System
 * 
 * Palette philosophy:
 * - LIGHT: Cool white-slate canvas, deep navy primary, gold accent
 * - DARK:  Near-black navy canvas, electric indigo primary, amber accent
 * 
 * Conveys: Authority, Security, Precision, Trustworthiness
 */

const config = defineConfig({
  theme: {
    tokens: {
      colors: {
        // ── Brand / Primary: Deep Indigo-Navy ─────────────────
        brand: {
          50:  { value: '#eef0ff' },
          100: { value: '#dde3ff' },
          200: { value: '#c4caff' },
          300: { value: '#a5abfc' },
          400: { value: '#8886f8' },
          500: { value: '#6d67f3' },
          600: { value: '#4f46e5' }, // primary action
          700: { value: '#3f37c9' },
          800: { value: '#3020a0' },
          900: { value: '#25177c' }, // deep trust
          950: { value: '#150d4e' },
        },

        // ── Navy: Dark structural ─────────────────────────────
        navy: {
          50:  { value: '#f0f4f8' },
          100: { value: '#d9e2ef' },
          200: { value: '#bcccdc' },
          300: { value: '#9fb3c8' },
          400: { value: '#829ab1' },
          500: { value: '#627d98' },
          600: { value: '#486581' },
          700: { value: '#334e68' },
          800: { value: '#243b53' },
          900: { value: '#102a43' },
          950: { value: '#06172b' },
        },

        // ── Gold: Accent / Highlight ──────────────────────────
        gold: {
          50:  { value: '#fffbeb' },
          100: { value: '#fef3c7' },
          200: { value: '#fde68a' },
          300: { value: '#fcd34d' },
          400: { value: '#fbbf24' },
          500: { value: '#f59e0b' },
          600: { value: '#d97706' },
          700: { value: '#b45309' },
          800: { value: '#92400e' },
          900: { value: '#78350f' },
        },

        // ── Slate: Neutral / Text ─────────────────────────────
        slate: {
          50:  { value: '#f8fafc' },
          100: { value: '#f1f5f9' },
          200: { value: '#e2e8f0' },
          300: { value: '#cbd5e1' },
          400: { value: '#94a3b8' },
          500: { value: '#64748b' },
          600: { value: '#475569' },
          700: { value: '#334155' },
          800: { value: '#1e293b' },
          900: { value: '#0f172a' },
          950: { value: '#080d18' },
        },

        // ── Semantic / Status ─────────────────────────────────
        success: {
          50:  { value: '#ecfdf5' },
          500: { value: '#10b981' },
          600: { value: '#059669' },
          700: { value: '#047857' },
        },
        danger: {
          50:  { value: '#fff1f2' },
          200: { value: '#fecdd3' },
          500: { value: '#f43f5e' },
          600: { value: '#e11d48' },
          700: { value: '#be123c' },
        },
        warning: {
          50:  { value: '#fffbeb' },
          500: { value: '#f59e0b' },
          600: { value: '#d97706' },
        },
        info: {
          50:  { value: '#eff6ff' },
          500: { value: '#3b82f6' },
          600: { value: '#2563eb' },
        },
      },

      fonts: {
        body:    { value: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif' },
        heading: { value: 'var(--font-geist-sans), ui-sans-serif, system-ui, sans-serif' },
        mono:    { value: 'var(--font-geist-mono), ui-monospace, monospace' },
      },

      shadows: {
        'glow-brand': { value: '0 0 20px rgba(79,70,229,0.25)' },
        'glow-gold':  { value: '0 0 20px rgba(245,158,11,0.20)' },
        'card-light': { value: '0 1px 3px rgba(0,0,0,0.06), 0 4px 16px rgba(79,70,229,0.07)' },
        'card-dark':  { value: '0 1px 3px rgba(0,0,0,0.4), 0 4px 16px rgba(0,0,0,0.3)' },
        'btn-brand':  { value: '0 4px 14px rgba(79,70,229,0.4)' },
      },

      radii: {
        'card': { value: '16px' },
        'input': { value: '10px' },
        'badge': { value: '6px' },
      },
    },

    semanticTokens: {
      colors: {
        // ── Canvas / Background ───────────────────────────────
        'bg.canvas': {
          value: {
            base: '#f0f4f8',     // cool slate-blue canvas (light)
            _dark: '#06090f',    // near-black deep navy (dark)
          },
        },
        'bg.surface': {
          value: {
            base: '#ffffff',
            _dark: '#0d1526',    // dark navy surface
          },
        },
        'bg.elevated': {
          value: {
            base: '#f8fafc',
            _dark: '#111d35',    // elevated panel
          },
        },
        'bg.subtle': {
          value: {
            base: '#f1f5f9',
            _dark: '#162036',
          },
        },
        'bg.muted': {
          value: {
            base: '#e8eef5',
            _dark: '#1a2844',
          },
        },

        // ── Brand Primary ─────────────────────────────────────
        'brand.solid': {
          value: {
            base: '#4f46e5',     // vibrant indigo (light bg)
            _dark: '#6366f1',    // slightly brighter indigo (dark bg)
          },
        },
        'brand.subtle': {
          value: {
            base: '#eef0ff',
            _dark: 'rgba(99,102,241,0.12)',
          },
        },
        'brand.muted': {
          value: {
            base: '#c4caff',
            _dark: 'rgba(99,102,241,0.25)',
          },
        },
        'brand.text': {
          value: {
            base: '#3730a3',     // dark indigo text (light)
            _dark: '#a5abfc',    // soft indigo text (dark)
          },
        },

        // ── Borders ───────────────────────────────────────────
        'border.default': {
          value: {
            base: '#dde1ea',
            _dark: '#1c2d4a',
          },
        },
        'border.strong': {
          value: {
            base: '#b8c0d0',
            _dark: '#243550',
          },
        },
        'border.brand': {
          value: {
            base: '#a5abfc',
            _dark: '#4f46e5',
          },
        },

        // ── Text ─────────────────────────────────────────────
        'text.primary': {
          value: {
            base: '#0d1226',     // near black with blue tint
            _dark: '#e8edf5',    // soft white-blue
          },
        },
        'text.secondary': {
          value: {
            base: '#4a5468',
            _dark: '#8899b0',
          },
        },
        'text.muted': {
          value: {
            base: '#7a8499',
            _dark: '#556070',
          },
        },
        'text.inverted': {
          value: {
            base: '#ffffff',
            _dark: '#0d1226',
          },
        },

        // ── Status ────────────────────────────────────────────
        'status.success.bg': {
          value: {
            base: '#ecfdf5',
            _dark: 'rgba(16,185,129,0.1)',
          },
        },
        'status.success.text': {
          value: {
            base: '#047857',
            _dark: '#34d399',
          },
        },
        'status.danger.bg': {
          value: {
            base: '#fff1f2',
            _dark: 'rgba(244,63,94,0.1)',
          },
        },
        'status.danger.text': {
          value: {
            base: '#be123c',
            _dark: '#fb7185',
          },
        },
        'status.warning.bg': {
          value: {
            base: '#fffbeb',
            _dark: 'rgba(245,158,11,0.1)',
          },
        },
        'status.warning.text': {
          value: {
            base: '#b45309',
            _dark: '#fbbf24',
          },
        },

        // ── Gold Accent ───────────────────────────────────────
        'accent.gold': {
          value: {
            base: '#d97706',
            _dark: '#fbbf24',
          },
        },
        'accent.gold.bg': {
          value: {
            base: '#fffbeb',
            _dark: 'rgba(251,191,36,0.1)',
          },
        },

        // ── Sidebar (Admin) ───────────────────────────────────
        'sidebar.bg': {
          value: {
            base: '#0f172a',     // always dark slate (design choice)
            _dark: '#060c1a',
          },
        },
        'sidebar.border': {
          value: {
            base: '#1a2540',
            _dark: '#10192e',
          },
        },
        'sidebar.item.active.bg': {
          value: {
            base: 'rgba(99,102,241,0.2)',
            _dark: 'rgba(99,102,241,0.25)',
          },
        },
        'sidebar.item.hover.bg': {
          value: {
            base: 'rgba(255,255,255,0.05)',
            _dark: 'rgba(255,255,255,0.04)',
          },
        },
        'sidebar.text': {
          value: {
            base: '#c8d0e0',
            _dark: '#9aabbf',
          },
        },
        'sidebar.text.active': {
          value: {
            base: '#a5abfc',
            _dark: '#818cf8',
          },
        },

        // ── Input ─────────────────────────────────────────────
        'input.bg': {
          value: {
            base: '#f8fafc',
            _dark: '#0d1526',
          },
        },
        'input.border': {
          value: {
            base: '#dde1ea',
            _dark: '#1c2d4a',
          },
        },
        'input.focus.border': {
          value: {
            base: '#4f46e5',
            _dark: '#6366f1',
          },
        },
      },
    },
  },

  globalCss: {
    '*, *::before, *::after': {
      boxSizing: 'border-box',
    },
    body: {
      bg: 'bg.canvas',
      color: 'text.primary',
      fontFamily: 'body',
      transition: 'background-color 0.2s ease, color 0.2s ease',
    },
    a: {
      color: 'inherit',
      textDecoration: 'none',
    },
    // Custom scrollbar
    '*::-webkit-scrollbar': {
      width: '6px',
      height: '6px',
    },
    '*::-webkit-scrollbar-track': {
      background: 'transparent',
    },
    '*::-webkit-scrollbar-thumb': {
      background: 'border.strong',
      borderRadius: '9999px',
    },
    '*::-webkit-scrollbar-thumb:hover': {
      background: 'text.muted',
    },
  },
});

export const system = createSystem(defaultConfig, config);
