import { useQuery } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, DashboardDailyTasksPayload, DashboardPipelineStats, DashboardStats } from "@/lib/types";

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

export function useDashboardPipelineStats(filters: { stateId?: number; status?: string; driveId?: number }) {
  return useQuery({
    queryKey: ["dashboard", "pipeline-stats", filters],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DashboardPipelineStats>>("/dashboard/pipeline-stats", {
        params: {
          state_id: filters.stateId || undefined,
          status: filters.status || undefined,
          drive_id: filters.driveId || undefined,
        },
      });
      return res.data.data;
    },
    staleTime: 60_000,
  });
}

export function useDashboardDailyTasks(filters: {
  date?: string;
  status?: "todo" | "in_progress" | "review" | "completed";
  limit?: number;
}) {
  return useQuery({
    queryKey: ["dashboard", "daily-tasks", filters],
    queryFn: async () => {
      const res = await api.get<ApiResponse<DashboardDailyTasksPayload>>("/dashboard/daily-tasks", {
        params: {
          date: filters.date || undefined,
          status: filters.status || undefined,
          limit: filters.limit ?? 50,
        },
      });
      return res.data.data;
    },
    staleTime: 60_000,
  });
}
