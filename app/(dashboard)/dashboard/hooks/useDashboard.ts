import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, DashboardPipelineStats, DashboardStats } from "@/lib/types";

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

export function useDashboardPipelineStats(filters: { stateId?: number; status?: string }) {
  return useQuery({
    queryKey: ["dashboard", "pipeline-stats", filters],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DashboardPipelineStats>>("/dashboard/pipeline-stats", {
        params: {
          state_id: filters.stateId || undefined,
          status: filters.status || undefined,
        },
      });
      return res.data.data;
    },
    staleTime: 60_000,
  });
}
