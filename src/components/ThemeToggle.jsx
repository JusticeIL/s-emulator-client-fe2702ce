import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <div className="flex items-center gap-4">
      <span className={`text-sm font-semibold transition-colors ${!isDark ? 'text-foreground' : 'text-muted-foreground'}`}>
        Light
      </span>
      <label className="theme-switch">
        <input 
          type="checkbox" 
          checked={isDark}
          onChange={toggleTheme}
          aria-label="Toggle theme"
        />
        <span className="slider">
          <span className="decorative-dot dot-1"></span>
          <span className="decorative-dot dot-2"></span>
        </span>
      </label>
      <span className={`text-sm font-semibold transition-colors ${isDark ? 'text-foreground' : 'text-muted-foreground'}`}>
        Dark
      </span>
    </div>
  );
}
