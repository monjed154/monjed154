import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AppSettings, Theme, Language } from "@/types";

interface SettingsStore {
  theme: Theme;
  language: Language;
  settings: Partial<AppSettings>;
  setTheme: (theme: Theme) => void;
  setLanguage: (language: Language) => void;
  setSettings: (settings: Partial<AppSettings>) => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      theme: "dark",
      language: "ar",
      settings: {},
      setTheme: (theme) => set({ theme }),
      setLanguage: (language) => set({ language }),
      setSettings: (settings) =>
        set((state) => ({ settings: { ...state.settings, ...settings } })),
    }),
    { name: "stockflow-settings" }
  )
);
