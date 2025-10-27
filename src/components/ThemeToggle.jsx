import React from "react";
import { useTheme } from "@/hooks/useTheme";
import { Sun, Moon, Cloud, Star } from "lucide-react";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      className="relative flex items-center gap-2"
      onClick={toggleTheme}
      role="switch"
      aria-checked={isDark}
      aria-label="Toggle light / dark mode"
      style={{
        background: 'transparent',
        border: 'none',
        padding: 0,
        cursor: 'pointer',
        outline: 'none',
      }}
    >
      {/* Text Label - Light (left side) */}
      <span
        style={{
          fontSize: '14px',
          fontWeight: '500',
          color: isDark ? 'hsl(210, 40%, 98%)' : 'hsl(0, 0%, 0%)',
          opacity: isDark ? 0 : 1,
          transform: isDark ? 'translateX(-10px)' : 'translateX(0)',
          transition: 'all 0.3s ease',
          pointerEvents: 'none',
        }}
      >
        Light
      </span>

      {/* Toggle Container */}
      <div
        style={{
          display: 'block',
          width: '64px',
          height: '32px',
          borderRadius: '16px',
          background: isDark ? 'hsl(189, 95%, 52%)' : 'hsl(210, 20%, 70%)',
          border: `2px solid ${isDark ? 'hsl(189, 95%, 52%)' : 'hsl(210, 20%, 50%)'}`,
          padding: '2px',
          position: 'relative',
          boxShadow: isDark ? '0 2px 8px rgba(0,0,0,0.2)' : 'none',
          transition: 'all 0.3s ease',
        }}
      >
        {/* Sliding Knob with Icon */}
        <div
          style={{
            width: '26px',
            height: '26px',
            background: isDark ? 'white' : 'hsl(45, 100%, 60%)',
            borderRadius: '50%',
            position: 'absolute',
            left: '2px',
            top: '50%',
            transform: isDark ? 'translateY(-50%) translateX(32px)' : 'translateY(-50%)',
            transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
            boxShadow: '0 2px 6px rgba(0,0,0,0.15)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {isDark ? (
            <Moon size={14} color="hsl(189, 95%, 52%)" fill="hsl(189, 95%, 52%)" />
          ) : (
            <Sun size={14} color="hsl(38, 92%, 50%)" fill="hsl(38, 92%, 50%)" />
          )}
        </div>

        {/* Stars for Dark Mode */}
        {isDark && (
          <>
            <Star
              size={6}
              color="white"
              fill="white"
              style={{
                position: 'absolute',
                left: '8px',
                top: '8px',
                opacity: 0.8,
              }}
            />
            <Star
              size={5}
              color="white"
              fill="white"
              style={{
                position: 'absolute',
                left: '14px',
                top: '18px',
                opacity: 0.6,
              }}
            />
          </>
        )}

        {/* Clouds for Light Mode */}
        {!isDark && (
          <>
            <Cloud
              size={8}
              color="white"
              fill="white"
              style={{
                position: 'absolute',
                right: '10px',
                top: '6px',
                opacity: 0.7,
              }}
            />
            <Cloud
              size={7}
              color="white"
              fill="white"
              style={{
                position: 'absolute',
                right: '6px',
                top: '14px',
                opacity: 0.5,
              }}
            />
          </>
        )}
      </div>

      {/* Text Label - Dark (right side) */}
      <span
        style={{
          fontSize: '14px',
          fontWeight: '500',
          color: 'hsl(210, 40%, 98%)',
          opacity: isDark ? 1 : 0,
          transform: isDark ? 'translateX(0)' : 'translateX(10px)',
          transition: 'all 0.3s ease',
          pointerEvents: 'none',
        }}
      >
        Dark
      </span>
    </button>
  );
}
