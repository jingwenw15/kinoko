export const colors = {
  shell: '#f2c6a0',
  cap: '#ff8fab',
  moss: '#9ecb8f',
  cream: '#fff1d6',
  muted: '#a9a29a',
  blue: '#9ad7ff',
  amber: '#ffd166'
} as const;

export const themes = {
  cozy: colors,
  pixel: {
    shell: '#7dd3fc',
    cap: '#f472b6',
    moss: '#86efac',
    cream: '#f8fafc',
    muted: '#94a3b8',
    blue: '#60a5fa',
    amber: '#facc15'
  },
  zen: {
    shell: '#a7f3d0',
    cap: '#c4b5fd',
    moss: '#bef264',
    cream: '#f5f5f4',
    muted: '#a8a29e',
    blue: '#bae6fd',
    amber: '#fde68a'
  }
} as const;

export type ThemeName = keyof typeof themes;
export type ThemePalette = typeof themes[ThemeName];
