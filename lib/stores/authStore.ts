import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CurrentUser } from "../types";

interface AuthState {
  token: string | null;
  user: CurrentUser | null;
  hasHydrated: boolean;
  setAuth: (token: string, user: CurrentUser) => void;
  clearAuth: () => void;
  setHasHydrated: (value: boolean) => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      token: null,
      user: null,
      hasHydrated: false,
      setAuth: (token, user) => set({ token, user }),
      clearAuth: () => set({ token: null, user: null }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
    }),
    {
      name: "fastlink-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
