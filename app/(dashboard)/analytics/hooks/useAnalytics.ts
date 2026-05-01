import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, DashboardStats } from "@/lib/types";

export function useAnalytics() {
  return useQuery({
    queryKey: ["analytics", "stats"],
    queryFn: async () => {
      // Falling back to dashboard stats as there's no dedicated analytics endpoint
      const res = await api.get<ApiResponse<DashboardStats>>("/dashboard/stats");
      return res.data.data;
    },
    staleTime: 60_000,
  });
}
