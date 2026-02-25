import { Sun, Moon } from 'lucide-react';
import { useLandingTheme } from './LandingThemeContext';

const ThemeToggle = () => {
  const { theme, toggle } = useLandingTheme();

  return (
    <button
      onClick={toggle}
      aria-label="Toggle dark mode"
      className="fixed top-4 left-4 z-50 w-10 h-10 rounded-full flex items-center justify-center transition-transform hover:scale-110 active:scale-95 shadow-lg"
      style={{
        background: theme === 'light' ? 'rgba(0,0,0,0.35)' : 'rgba(255,255,255,0.15)',
        color: 'white',
        backdropFilter: 'blur(8px)',
      }}
    >
      {theme === 'light' ? <Moon className="h-4 w-4" /> : <Sun className="h-4 w-4" />}
    </button>
  );
};

export default ThemeToggle;
