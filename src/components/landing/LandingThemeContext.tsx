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
  pageBg: '#0a0d14',
  sectionBg: '#10141c',
  sectionBgAlt: '#161b26',
  heading: '#f2f4f7',
  text: '#b8c0cc',
  textMuted: '#8a94a4',
  label: '#8a94a4',
  cardBg: '#161b26',
  cardBorder: '#252b38',
  darkBg: '#080b12',
  darkBgGradient: 'linear-gradient(135deg, #080b12 0%, #121828 100%)',
  darkText: '#f2f4f7',
  darkTextMuted: 'rgba(255,255,255,0.58)',
  darkTextSoft: 'rgba(255,255,255,0.65)',
  darkLabel: 'rgba(255,255,255,0.45)',
  footerBg: '#060810',
};

export const LandingThemeProvider = ({ children }: { children: ReactNode }) => {
  const theme: LandingTheme = 'dark';
  const toggle = () => {};
  const colors = darkColors;

  return (
    <LandingThemeContext.Provider value={{ theme, toggle, colors }}>
      {children}
    </LandingThemeContext.Provider>
  );
};

export const useLandingTheme = () => useContext(LandingThemeContext);
