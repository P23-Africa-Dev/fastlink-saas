import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/authStore";
import type { ApiResponse, CurrentUser } from "@/lib/types";

export function useCurrentUser() {
  const token = useAuthStore((s) => s.token);
  const setAuth = useAuthStore((s) => s.setAuth);

  return useQuery({
    queryKey: ["auth", "me"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<CurrentUser>>("/auth/me");
      const user = res.data.data;
      // Keep the store in sync with the latest profile data
      setAuth(token!, user);
      return user;
    },
    enabled: !!token,
    staleTime: 5 * 60_000,
  });
}
