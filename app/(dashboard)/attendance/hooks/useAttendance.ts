import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, Attendance, LeaveRequest } from "@/lib/types";

export function useAttendance(filters: { startDate?: string; endDate?: string; userId?: number }) {
  return useQuery({
    queryKey: ["attendance", filters],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Attendance[]>>("/attendance", {
        params: {
          start_date: filters.startDate,
          end_date: filters.endDate,
          user_id: filters.userId,
          per_page: 100,
        },
      });
      return res.data.data;
    },
  });
}

export function useSignIn() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { note?: string }) => {
      const res = await api.post<ApiResponse<Attendance>>("/attendance/sign-in", payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useSignOut() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { note?: string }) => {
      const res = await api.post<ApiResponse<Attendance>>("/attendance/sign-out", payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["attendance"] });
    },
  });
}

export function useLeaveRequests() {
  return useQuery({
    queryKey: ["leave-requests"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<LeaveRequest[]>>("/leave-requests", {
        params: { per_page: 100 },
      });
      return res.data.data;
    },
  });
}

export function useCreateLeaveRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<LeaveRequest>) => {
      const res = await api.post<ApiResponse<LeaveRequest>>("/leave-requests", payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
    },
  });
}

export function useUpdateLeaveStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status, ...payload }: { id: number; status: string; [key: string]: any }) => {
      const res = await api.post<ApiResponse<LeaveRequest>>(`/leave-requests/${id}/decide`, { status, ...payload });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
    },
  });
}

export function useRespondToLeave() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, accept, ...payload }: { id: number; accept: boolean; [key: string]: any }) => {
      const res = await api.post<ApiResponse<LeaveRequest>>(`/leave-requests/${id}/respond`, { accept, ...payload });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["leave-requests"] });
    },
  });
}

export function useUsers() {
  return useQuery({
    queryKey: ["users"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<any[]>>("/users", { params: { per_page: 200 } });
      return res.data.data;
    },
  });
}
