import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';

type LandingTheme = 'light' | 'dark';

const LandingThemeContext = createContext<{
  theme: LandingTheme;
  toggle: () => void;
  colors: typeof lightColors;
}>({ theme: 'light', toggle: () => {}, colors: {} as any });

const lightColors = {
  pageBg: '#ffffff',
  sectionBg: '#f8fafc',
  sectionBgAlt: '#ffffff',
  heading: '#0f172a',
  text: '#475569',
  textMuted: '#64748b',
  label: '#94a3b8',
  cardBg: '#ffffff',
  cardBorder: '#e2e8f0',
  darkBg: '#0F2A44',
  darkBgGradient: 'linear-gradient(135deg, #0F2A44 0%, #1a3a5c 100%)',
  darkText: '#ffffff',
  darkTextMuted: 'rgba(255,255,255,0.5)',
  darkTextSoft: 'rgba(255,255,255,0.55)',
  darkLabel: 'rgba(255,255,255,0.4)',
  footerBg: '#091a2a',
};

const darkColors = {
  pageBg: '#0a0a0a',
  sectionBg: '#111111',
  sectionBgAlt: '#1a1a1a',
  heading: '#f1f5f9',
  text: '#a1a1aa',
  textMuted: '#71717a',
  label: '#71717a',
  cardBg: '#1a1a1a',
  cardBorder: '#27272a',
  darkBg: '#0a0f18',
  darkBgGradient: 'linear-gradient(135deg, #0a0f18 0%, #111827 100%)',
  darkText: '#f1f5f9',
  darkTextMuted: 'rgba(255,255,255,0.45)',
  darkTextSoft: 'rgba(255,255,255,0.5)',
  darkLabel: 'rgba(255,255,255,0.35)',
  footerBg: '#050505',
};

export const LandingThemeProvider = ({ children }: { children: ReactNode }) => {
  const [theme, setTheme] = useState<LandingTheme>(() => {
    if (typeof window !== 'undefined') {
      return (localStorage.getItem('landing-theme') as LandingTheme) || 'light';
    }
    return 'light';
  });

  useEffect(() => {
    localStorage.setItem('landing-theme', theme);
  }, [theme]);

  const toggle = () => setTheme(prev => prev === 'light' ? 'dark' : 'light');
  const colors = theme === 'light' ? lightColors : darkColors;

  return (
    <LandingThemeContext.Provider value={{ theme, toggle, colors }}>
      {children}
    </LandingThemeContext.Provider>
  );
};

export const useLandingTheme = () => useContext(LandingThemeContext);
