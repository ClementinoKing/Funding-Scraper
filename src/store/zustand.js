import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export const useStore = create(
  persist(
    (set) => ({
      onboardingData: null,
      setOnboardingData: (data) => set({ onboardingData: data }),
      clearOnboardingData: () => set({ onboardingData: null }),

      onboardingSession: null,
      setOnboardingSession: (data) => set({ onboardingSession: data }),
      clearOnboardingSession: () => set({ onboardingSession: null }),
    }),
    {
      name: "funding-scraper-storage",
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
