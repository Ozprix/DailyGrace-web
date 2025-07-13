// src/contexts/theme-context.tsx
"use client";

import type { ReactNode } from 'react';
import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { analytics } from '@/lib/firebase/config'; 
import { logEvent } from 'firebase/analytics';
import { useUserPreferences } from '@/hooks/use-user-preferences'; // Added
import { useContent } from '@/contexts/content-context'; // Added

type Theme = "light" | "dark" | "system";

interface ThemeContextType {
  theme: Theme; // User's selected preference (light, dark, system)
  setTheme: (theme: Theme) => void; // Sets the preference
  resolvedTheme: "light" | "dark"; // Actual theme applied (light or dark)
  activeCustomThemeId: string | null; // ID of the active custom theme
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "dailyGraceTheme";
const CUSTOM_THEME_CLASS_PREFIX = "custom-theme-"; // For cleaning up old custom theme classes

export function ThemeProvider({ children }: { children: ReactNode }) {
  const { preferences, setActiveCustomTheme: persistActiveCustomTheme, isLoaded: prefsLoaded } = useUserPreferences();
  const { getThemeItemById, isLoadingContent: contentLoading } = useContent();

  const [theme, setThemeState] = useState<Theme>(() => {
    if (typeof window === 'undefined') return "system"; 
    return (localStorage.getItem(THEME_STORAGE_KEY) as Theme | null) || "system";
  });
  const [resolvedTheme, setResolvedTheme] = useState<"light" | "dark">("light");
  const [currentAppliedCustomClass, setCurrentAppliedCustomClass] = useState<string | null>(null);


  const applyTheme = useCallback((selectedThemePref: Theme, activeCustomThemeIdFromPrefs: string | null) => {
    if (typeof window === 'undefined' || contentLoading) return;

    let baseTheme: "light" | "dark";
    if (selectedThemePref === "system") {
      baseTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      baseTheme = selectedThemePref;
    }

    const root = window.document.documentElement;
    
    // Remove old base theme, add new base theme
    root.classList.remove("light", "dark");
    root.classList.add(baseTheme);
    setResolvedTheme(baseTheme);

    // Handle custom theme
    let newCustomThemeClass: string | null = null;
    if (activeCustomThemeIdFromPrefs) {
      const themeDetails = getThemeItemById(activeCustomThemeIdFromPrefs);
      if (themeDetails && themeDetails.themeClassName) {
        newCustomThemeClass = themeDetails.themeClassName;
      }
    }

    // Remove previously applied custom theme class if it's different or being cleared
    if (currentAppliedCustomClass && currentAppliedCustomClass !== newCustomThemeClass) {
      root.classList.remove(currentAppliedCustomClass);
    }

    // Apply new custom theme class if there is one
    if (newCustomThemeClass && newCustomThemeClass !== currentAppliedCustomClass) {
      root.classList.add(newCustomThemeClass);
      setCurrentAppliedCustomClass(newCustomThemeClass);
    } else if (!newCustomThemeClass && currentAppliedCustomClass) {
      // If newCustomThemeClass is null, it means we're clearing the custom theme
      setCurrentAppliedCustomClass(null);
    }

  }, [contentLoading, getThemeItemById, currentAppliedCustomClass]);

  // Effect to apply theme based on preference and custom theme ID
  useEffect(() => {
    if (prefsLoaded && !contentLoading) {
      applyTheme(theme, preferences.activeCustomThemeId || null);
    }
  }, [theme, preferences.activeCustomThemeId, prefsLoaded, contentLoading, applyTheme]);

  // Effect for system theme changes
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
    const handleChange = () => {
      if (theme === "system") { // Only re-apply if current preference is "system"
         if (prefsLoaded && !contentLoading) {
            applyTheme("system", preferences.activeCustomThemeId || null);
         }
      }
    };
    mediaQuery.addEventListener("change", handleChange);
    return () => mediaQuery.removeEventListener("change", handleChange);
  }, [theme, prefsLoaded, contentLoading, preferences.activeCustomThemeId, applyTheme]);


  // Function to set the base theme preference (light, dark, system)
  const setTheme = (newThemePreference: Theme) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(THEME_STORAGE_KEY, newThemePreference);
    }
    if (analytics) {
      logEvent(analytics, 'base_theme_preference_changed', { 
        new_theme_preference: newThemePreference 
      });
    }
    setThemeState(newThemePreference);
    // When base theme preference changes, also clear any active custom theme
    // persistActiveCustomTheme comes from useUserPreferences
    if (preferences.activeCustomThemeId) { 
      persistActiveCustomTheme(null); 
      if(analytics) {
        logEvent(analytics, 'custom_theme_cleared_due_to_base_change');
      }
    }
  };
  
  useEffect(() => {
    // Initialize resolvedTheme on client-side mount
    if (typeof window !== 'undefined') {
      const initialBase = theme === "system"
        ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light")
        : theme;
      setResolvedTheme(initialBase as "light" | "dark");
    }
  }, [theme]);


  const value = { 
    theme, 
    setTheme, 
    resolvedTheme,
    activeCustomThemeId: prefsLoaded ? preferences.activeCustomThemeId || null : null
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
