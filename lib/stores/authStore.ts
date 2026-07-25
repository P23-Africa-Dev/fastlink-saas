import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CurrentUser, OrganizationSummary } from "../types";

interface AuthState {
  token: string | null;
  user: CurrentUser | null;
  currentOrganizationId: number | null;
  hasHydrated: boolean;
  setAuth: (token: string, user: CurrentUser) => void;
  setUser: (user: CurrentUser) => void;
  setCurrentOrganizationId: (id: number | null) => void;
  clearAuth: () => void;
  setHasHydrated: (value: boolean) => void;
  organizations: () => OrganizationSummary[];
  currentOrganization: () => OrganizationSummary | null;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      currentOrganizationId: null,
      hasHydrated: false,
      setAuth: (token, user) =>
        set({
          token,
          user,
          currentOrganizationId: user.current_organization_id ?? null,
        }),
      setUser: (user) =>
        set({
          user,
          currentOrganizationId: user.current_organization_id ?? get().currentOrganizationId,
        }),
      setCurrentOrganizationId: (id) => set({ currentOrganizationId: id }),
      clearAuth: () => set({ token: null, user: null, currentOrganizationId: null }),
      setHasHydrated: (value) => set({ hasHydrated: value }),
      organizations: () => get().user?.organizations ?? [],
      currentOrganization: () => {
        const state = get();
        const orgs = state.user?.organizations ?? [];
        return orgs.find((o) => o.id === state.currentOrganizationId) ?? state.user?.current_organization ?? null;
      },
    }),
    {
      name: "fastlink-auth",
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    }
  )
);
