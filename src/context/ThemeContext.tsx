import { storage } from "@/lib/storage";
import { applyTheme, getMode, type ThemeMode } from "@/theme";
import React, {
  Fragment,
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

const KEY = "gc_theme";

interface ThemeState {
  mode: ThemeMode;
  isDark: boolean;
  toggle: () => void;
  setMode: (m: ThemeMode) => void;
}

const ThemeCtx = createContext<ThemeState>({
  mode: "light",
  isDark: false,
  toggle: () => {},
  setMode: () => {},
});

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  // theme.ts already read the saved mode synchronously at import time,
  // so start from it to keep `mode` and `colors` in sync on first render.
  const [mode, setModeState] = useState<ThemeMode>(getMode());

  const setMode = useCallback((m: ThemeMode) => {
    applyTheme(m);
    setModeState(m);
    Promise.resolve(storage.set(KEY, m)).catch(() => {});
  }, []);

  const toggle = useCallback(() => {
    setMode(mode === "dark" ? "light" : "dark");
  }, [mode, setMode]);

  const value = useMemo(
    () => ({ mode, isDark: mode === "dark", toggle, setMode }),
    [mode, toggle, setMode],
  );

  return <ThemeCtx.Provider value={value}>{children}</ThemeCtx.Provider>;
}

export function useTheme() {
  return useContext(ThemeCtx);
}

/** Remounts a screen when the theme changes so it repaints with the new colours */
export function ThemeKey({ children }: { children: React.ReactNode }) {
  const { mode } = useTheme();
  return <Fragment key={mode}>{children}</Fragment>;
}
