import React from "react";
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
        {/* Stars for dark mode */}
        <span className="star star-1"></span>
        <span className="star star-2"></span>
        <span className="star star-3"></span>
        <span className="star star-4"></span>
        <span className="star star-5"></span>
        
        {/* Clouds for light mode */}
        <span className="cloud cloud-1"></span>
        <span className="cloud cloud-2"></span>
        
        {/* Sun/Moon circle with details */}
        <span className="celestial">
          <span className="crater crater-1"></span>
          <span className="crater crater-2"></span>
          <span className="crater crater-3"></span>
        </span>
      </span>
    </label>
  );
}
