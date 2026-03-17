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
  pageBg: '#0c0e14',
  sectionBg: '#12151d',
  sectionBgAlt: '#181c26',
  heading: '#f0f2f5',
  text: '#b0b8c4',
  textMuted: '#8892a0',
  label: '#8892a0',
  cardBg: '#181c26',
  cardBorder: '#2a2f3a',
  darkBg: '#0a0e18',
  darkBgGradient: 'linear-gradient(135deg, #0a0e18 0%, #141a28 100%)',
  darkText: '#f0f2f5',
  darkTextMuted: 'rgba(255,255,255,0.55)',
  darkTextSoft: 'rgba(255,255,255,0.6)',
  darkLabel: 'rgba(255,255,255,0.42)',
  footerBg: '#070910',
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
