import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, DashboardStats } from "@/lib/types";

export function useDashboardStats() {
  return useQuery({
    queryKey: ["dashboard", "stats"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DashboardStats>>("/dashboard/stats");
      return res.data.data;
    },
    staleTime: 60_000,
  });
}
