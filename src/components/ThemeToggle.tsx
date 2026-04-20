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
      className={`inline-flex items-center justify-center w-7 h-7 rounded-full border border-ink/40 bg-parchment-light/60 text-ink hover:bg-parchment-dark hover:border-crimson transition ${className}`}
    >
      {isDark ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
    </button>
  );
};
