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
        <Sun className="icon sun-icon" />
        <Moon className="icon moon-icon" />
      </span>
    </label>
  );
}
