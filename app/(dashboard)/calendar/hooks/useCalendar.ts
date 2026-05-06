"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type {
  ApiResponse,
  CalendarEvent,
  CalendarEventsParams,
  CreateCalendarTaskPayload,
  Task,
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
