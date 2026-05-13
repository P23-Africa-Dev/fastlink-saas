"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  ApiResponse,
  CalendarEvent,
  CalendarEventsParams,
  CreateCalendarTaskPayload,
  GoogleCalendarConnectPayload,
  GoogleCalendarConnectionStatus,
  CreateMeetingPayload,
  Meeting,
  Task,
  UpdateMeetingPayload,
} from "@/lib/types";

export function useCalendarEvents(params: CalendarEventsParams) {
  return useQuery({
    queryKey: ["calendar-events", params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<CalendarEvent[]>>("/calendar/events", { params });
      return res.data.data;
    },
  });
}

export function useMeetings(params: { start_date?: string; end_date?: string; per_page?: number }) {
  return useQuery({
    queryKey: ["meetings", params],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Meeting[]>>("/meetings", { params });
      return res.data.data;
    },
  });
}

export function useGoogleCalendarStatus(enabled = true) {
  return useQuery({
    queryKey: ["google-calendar-status"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<GoogleCalendarConnectionStatus>>("/google/calendar/status");
      return res.data.data;
    },
    enabled,
    staleTime: 30_000,
  });
}

export function useGoogleCalendarConnect() {
  return useMutation({
    mutationFn: async () => {
      const res = await api.get<ApiResponse<GoogleCalendarConnectPayload>>("/google/calendar/connect");
      return res.data.data;
    },
  });
}

export function useCreateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: CreateMeetingPayload) => {
      const res = await api.post<ApiResponse<Meeting>>("/meetings", payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}

export function useUpdateMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: UpdateMeetingPayload }) => {
      const res = await api.put<ApiResponse<Meeting>>(`/meetings/${id}`, payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}

export function useDeleteMeeting() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/meetings/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
      queryClient.invalidateQueries({ queryKey: ["meetings"] });
    },
  });
}

export function useCreateCalendarTask() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (payload: CreateCalendarTaskPayload) => {
      const res = await api.post<ApiResponse<Task>>("/calendar/tasks", payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendar-events"] });
    },
  });
}
