import React from "react";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      className={`ios-toggle ${isDark ? 'on' : ''}`}
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle light / dark mode"
    />
  );
}
