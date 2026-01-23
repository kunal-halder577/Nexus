import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'

export const useUiStore = create(
  persist(
    (set) => ({
      theme: "system", // default
      setTheme: (theme) => set({ theme }),
    }),
    {
      name: "nexus-theme-storage", // unique name in localStorage
      storage: createJSONStorage(() => localStorage),
    }
  )
)