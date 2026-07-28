"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import {
  applyThemeClass,
  isThemeMode,
  readStoredTheme,
  storeTheme,
  type ThemeMode,
} from "@/lib/theme";

type ThemeContextValue = {
  theme: ThemeMode;
  setTheme: (theme: ThemeMode) => void;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  initialTheme = "dark",
}: {
  children: ReactNode;
  initialTheme?: ThemeMode;
}) {
  const [theme, setThemeState] = useState<ThemeMode>(initialTheme);

  // Hydrate from localStorage / server settings after mount
  useEffect(() => {
    const stored = readStoredTheme();
    if (stored) {
      setThemeState(stored);
      applyThemeClass(stored);
      return;
    }
    applyThemeClass(initialTheme);
  }, [initialTheme]);

  // Keep class in sync when state changes
  useEffect(() => {
    applyThemeClass(theme);
    storeTheme(theme);
  }, [theme]);

  // Optional: pick up theme saved in settings (shared wall preference)
  useEffect(() => {
    let cancelled = false;
    async function syncFromServer() {
      try {
        const res = await fetch("/api/settings", { cache: "no-store" });
        if (!res.ok) return;
        const json = (await res.json()) as {
          settings?: { theme?: string };
        };
        const remote = json.settings?.theme;
        if (!cancelled && isThemeMode(remote)) {
          setThemeState(remote);
        }
      } catch {
        // offline / first boot
      }
    }
    void syncFromServer();
    return () => {
      cancelled = true;
    };
  }, []);

  const setTheme = useCallback((next: ThemeMode) => {
    setThemeState(next);
    // Best-effort persist for wall + companion
    void fetch("/api/settings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action: "updateTheme", theme: next }),
    }).catch(() => undefined);
  }, []);

  const toggleTheme = useCallback(() => {
    setTheme(theme === "dark" ? "light" : "dark");
  }, [setTheme, theme]);

  const value = useMemo(
    () => ({ theme, setTheme, toggleTheme }),
    [theme, setTheme, toggleTheme]
  );

  return (
    <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
  );
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    return {
      theme: "dark" as ThemeMode,
      setTheme: (_: ThemeMode) => undefined,
      toggleTheme: () => undefined,
    };
  }
  return ctx;
}
