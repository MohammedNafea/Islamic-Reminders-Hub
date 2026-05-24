import { createContext, useContext, useEffect, useState } from "react";

type Theme = "dark" | "light" | "system" | "fajr" | "duha" | "maghrib" | "sahar" | "dynamic";

type ThemeProviderProps = {
  children: React.ReactNode;
  defaultTheme?: Theme;
  storageKey?: string;
};

type ThemeProviderState = {
  theme: Theme;
  setTheme: (theme: Theme) => void;
};

const initialState: ThemeProviderState = {
  theme: "system",
  setTheme: () => null,
};

const ThemeProviderContext = createContext<ThemeProviderState>(initialState);

export function ThemeProvider({
  children,
  defaultTheme = "system",
  storageKey = "vite-ui-theme",
  ...props
}: ThemeProviderProps) {
  const [theme, setTheme] = useState<Theme>(
    () => (localStorage.getItem(storageKey) as Theme) || defaultTheme
  );

  useEffect(() => {
    const root = window.document.documentElement;

    root.classList.remove("light", "dark", "theme-fajr", "theme-duha", "theme-maghrib", "theme-sahar");

    let activeTheme = theme;

    if (theme === "dynamic") {
      const hour = new Date().getHours();
      if (hour >= 4 && hour < 7) activeTheme = "fajr";
      else if (hour >= 7 && hour < 17) activeTheme = "duha";
      else if (hour >= 17 && hour < 19) activeTheme = "maghrib";
      else if (hour >= 19 || hour < 4) activeTheme = "sahar";
    }

    if (activeTheme === "system") {
      const systemTheme = window.matchMedia("(prefers-color-scheme: dark)")
        .matches
        ? "dark"
        : "light";

      root.classList.add(systemTheme);
      return;
    }

    if (["fajr", "duha", "maghrib", "sahar"].includes(activeTheme)) {
      root.classList.add(`theme-${activeTheme}`);
      // Also add dark/light base for shadcn components
      if (activeTheme === "sahar") root.classList.add("dark");
      else root.classList.add("light");
    } else {
      root.classList.add(activeTheme);
    }
  }, [theme]);

  const value = {
    theme,
    setTheme: (theme: Theme) => {
      localStorage.setItem(storageKey, theme);
      setTheme(theme);
    },
  };

  return (
    <ThemeProviderContext.Provider {...props} value={value}>
      {children}
    </ThemeProviderContext.Provider>
  );
}

export const useTheme = () => {
  const context = useContext(ThemeProviderContext);

  if (context === undefined)
    throw new Error("useTheme must be used within a ThemeProvider");

  return context;
};
