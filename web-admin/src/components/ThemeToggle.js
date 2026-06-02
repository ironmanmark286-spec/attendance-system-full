import React from "react";
import { Sun, Moon } from "lucide-react";

export default function ThemeToggle({ theme, onToggleTheme, style }) {
  const isDark = theme === "dark";
  return (
    <button
      onClick={onToggleTheme}
      aria-pressed={isDark}
      title={isDark ? "Switch to light mode" : "Switch to dark mode"}
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 8,
        padding: 8,
        borderRadius: 8,
        background: "var(--bg-input)",
        border: "1px solid var(--border)",
        color: "var(--text-main)",
        cursor: "pointer",
        ...style,
      }}
    >
      {isDark ? <Sun size={16} /> : <Moon size={16} />}
      <span style={{ fontSize: 13, fontWeight: 700 }}>{isDark ? "Light Mode" : "Dark Mode"}</span>
    </button>
  );
}
