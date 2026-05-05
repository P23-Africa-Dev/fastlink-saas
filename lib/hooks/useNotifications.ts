import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef } from "react";
import api from "@/lib/api";
import type { ApiResponse } from "@/lib/types";

// ─── Types ────────────────────────────────────────────────────────────────────

export interface AppNotification {
  id: number;
  user_id: number;
  type: string;
  title: string;
  message: string;
  metadata: Record<string, unknown>;
  is_read: boolean;
  priority: "low" | "medium" | "high";
  dedupe_key: string | null;
  created_at: string;
}

interface NotificationsResponse {
  data: AppNotification[];
  meta: {
    pagination?: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  };
}

// ─── Queries ─────────────────────────────────────────────────────────────────

export function useNotificationList(unreadOnly: boolean, perPage = 20) {
  return useQuery({
    queryKey: ["notifications", unreadOnly, perPage],
    queryFn: async () => {
      const res = await api.get<NotificationsResponse>("/notifications", {
        params: { per_page: perPage, unread_only: unreadOnly },
      });
      return res.data;
    },
    staleTime: 30_000,
  });
}

export function useUnreadCount() {
  return useQuery({
    queryKey: ["notifications-unread-count"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<{ unread_count: number }>>("/notifications/unread-count");
      return res.data.data.unread_count;
    },
    staleTime: 10_000,
  });
}

// ─── Polling ─────────────────────────────────────────────────────────────────

export function useNotificationPolling() {
  const queryClient = useQueryClient();
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const startPolling = () => {
    if (intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      if (document.visibilityState === "hidden") return;
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
    }, 10_000);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  useEffect(() => {
    startPolling();
    const handleVisibility = () => {
      if (document.visibilityState === "visible") {
        queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
        queryClient.invalidateQueries({ queryKey: ["notifications"] });
        startPolling();
      } else {
        stopPolling();
      }
    };
    document.addEventListener("visibilitychange", handleVisibility);
    return () => {
      stopPolling();
      document.removeEventListener("visibilitychange", handleVisibility);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useMarkAsRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (ids: number[]) => {
      await api.post("/notifications/mark-as-read", { ids });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
}

export function useMarkAllRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      await api.post("/notifications/mark-all-read");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
}

export function useDeleteNotification() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/notifications/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["notifications"] });
      queryClient.invalidateQueries({ queryKey: ["notifications-unread-count"] });
    },
  });
}

// ─── Browser push helper ──────────────────────────────────────────────────────

export function triggerBrowserNotification(notification: AppNotification) {
  if (typeof window === "undefined") return;
  if (!("Notification" in window)) return;

  const shouldFire =
    notification.priority === "high" ||
    notification.metadata?.device_recommended === true;

  if (!shouldFire) return;

  if (Notification.permission === "granted") {
    new Notification(notification.title, { body: notification.message, icon: "/favicon.ico" });
  } else if (Notification.permission === "default") {
    Notification.requestPermission().then((perm) => {
      if (perm === "granted") {
        new Notification(notification.title, { body: notification.message, icon: "/favicon.ico" });
      }
    });
  }
}
