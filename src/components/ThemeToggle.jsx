import React from "react";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      className="ios-toggle"
      style={{
        display: 'block',
        width: '56px',
        height: '32px',
        borderRadius: '16px',
        background: isDark ? 'hsl(189, 95%, 52%)' : 'hsl(210, 20%, 70%)',
        border: `2px solid ${isDark ? 'hsl(189, 95%, 52%)' : 'hsl(210, 20%, 50%)'}`,
        padding: '3px',
        position: 'relative',
        cursor: 'pointer',
        boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
        transition: 'all 0.22s ease',
      }}
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle light / dark mode"
    >
      <div
        style={{
          width: '26px',
          height: '26px',
          background: 'white',
          borderRadius: '50%',
          position: 'absolute',
          left: '3px',
          top: '50%',
          transform: isDark ? 'translateY(-50%) translateX(24px)' : 'translateY(-50%)',
          transition: 'transform 0.22s cubic-bezier(0.2, 0.9, 0.2, 1)',
          boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
        }}
      />
    </button>
  );
}
