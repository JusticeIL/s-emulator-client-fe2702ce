import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <label className="theme-switch">
      <input 
        type="checkbox" 
        checked={isDark}
        onChange={toggleTheme}
        aria-label="Toggle theme"
      />
      <span className="slider">
        <Sun className="theme-icon sun-icon" size={14} />
        <Moon className="theme-icon moon-icon" size={14} />
      </span>
    </label>
  );
}
