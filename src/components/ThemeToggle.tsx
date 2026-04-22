import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

export const ThemeToggle = ({ className = "" }: { className?: string }) => {
  const { theme, toggle } = useTheme();
  const isDark = theme === "dark";
  return (
    <button
      onClick={toggle}
      title={isDark ? "Light mode" : "Dark mode"}
      aria-label="Toggle theme"
      className={`relative inline-flex items-center justify-center w-9 h-9 rounded-full glass-subtle text-foreground hover:border-crimson/50 transition ${className}`}
    >
      <Sun className={`w-4 h-4 absolute transition-all ${isDark ? "opacity-0 rotate-90 scale-50" : "opacity-100 rotate-0 scale-100"}`} />
      <Moon className={`w-4 h-4 absolute transition-all ${isDark ? "opacity-100 rotate-0 scale-100" : "opacity-0 -rotate-90 scale-50"}`} />
    </button>
  );
};
