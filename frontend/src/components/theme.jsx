import { useUiStore } from "@/stores/ui.store";
import { useEffect } from "react";

export const useThemeEffect = () => {
  const theme = useUiStore(s => s.theme);

  useEffect(() => {
    const root = window.document.documentElement;

    // 1. Clean up previous classes
    root.classList.remove("light", "dark");

    // 2. Logic for System vs Explicit
    if (theme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    // 3. Apply explicit theme
    root.classList.add(theme);
  }, [theme]);
};