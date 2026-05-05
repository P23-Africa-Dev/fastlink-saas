import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse } from "@/lib/types";

// ─── Types ─────────────────────────────────────────────────────────────────

export interface ProfileData {
  id: number;
  name: string;
  email: string;
  appearance: "light" | "dark" | "system";
  suspended_at: string | null;
  first_logged_in_at: string | null;
  created_at: string;
  updated_at: string;
  roles: { id: number; name: string }[];
}

export interface CompanySettings {
  id: number;
  company_name: string | null;
  opening_time: string;
  closing_time: string;
  working_days: string[];
  timezone: string;
  updated_by: number;
  created_at: string;
  updated_at: string;
}

export interface Passcode {
  id: number;
  supervisor_id: number;
  expires_at: string | null;
  is_active: boolean;
  generated_by: number;
  created_at: string;
  supervisor: { id: number; name: string; email: string } | null;
  generated_by_user: { id: number; name: string; email: string } | null;
}

// ─── Profile ────────────────────────────────────────────────────────────────

export function useProfile() {
  return useQuery({
    queryKey: ["settings-profile"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<ProfileData>>("/settings/profile");
      return res.data.data;
    },
    staleTime: 5 * 60_000,
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      name?: string;
      email?: string;
      current_password?: string;
      password?: string;
      password_confirmation?: string;
    }) => {
      const res = await api.patch<ApiResponse<ProfileData>>("/settings/profile", payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-profile"] });
    },
  });
}

// ─── Appearance ─────────────────────────────────────────────────────────────

export function useUpdateAppearance() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (appearance: "light" | "dark" | "system") => {
      const res = await api.patch<ApiResponse<{ appearance: string }>>("/settings/appearance", { appearance });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-profile"] });
    },
  });
}

// ─── Company ────────────────────────────────────────────────────────────────

export function useCompanySettings() {
  return useQuery({
    queryKey: ["settings-company"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<CompanySettings>>("/settings/company");
      return res.data.data;
    },
    staleTime: 5 * 60_000,
  });
}

export function useUpdateCompanySettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      payload,
      supervisorToken,
    }: {
      payload: Partial<Omit<CompanySettings, "id" | "updated_by" | "created_at" | "updated_at">>;
      supervisorToken?: { type: "session" | "device"; value: string };
    }) => {
      const headers: Record<string, string> = {};
      if (supervisorToken?.type === "session") {
        headers["X-Supervisor-Session-Token"] = supervisorToken.value;
      } else if (supervisorToken?.type === "device") {
        headers["X-Supervisor-Device-Token"] = supervisorToken.value;
      }
      const res = await api.patch<ApiResponse<CompanySettings>>("/settings/company", payload, { headers });
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-company"] });
    },
  });
}

// ─── Passcodes ───────────────────────────────────────────────────────────────

export function usePasscodes(supervisorId?: number) {
  return useQuery({
    queryKey: ["settings-passcodes", supervisorId],
    queryFn: async () => {
      const params = supervisorId ? { supervisor_id: supervisorId } : {};
      const res = await api.get<ApiResponse<Passcode[]>>("/settings/company/passcodes", { params });
      return res.data.data;
    },
    staleTime: 2 * 60_000,
  });
}

export function useGeneratePasscode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: { supervisor_id: number; expires_at?: string }) => {
      const res = await api.post<ApiResponse<{ passcode: Passcode; plain_text: string; notice: string }>>(
        "/settings/company/passcodes",
        payload
      );
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-passcodes"] });
    },
  });
}

export function useRevokePasscode() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/settings/company/passcodes/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings-passcodes"] });
    },
  });
}

// ─── Supervisor Passcode Verification ────────────────────────────────────────

export async function verifyPasscode(passcode: string, rememberDevice: boolean) {
  const res = await api.post<
    ApiResponse<{ session_token: string; device_token?: string; session_expires_in_seconds: number }>
  >("/settings/company/verify-passcode", { passcode, remember_device: rememberDevice });
  return res.data.data;
}

export async function validateDeviceToken(deviceToken: string) {
  const res = await api.post<ApiResponse<{ valid: boolean }>>("/settings/company/validate-device-token", {
    device_token: deviceToken,
  });
  return res.data.data;
}

// ─── Supervisors list (for passcode generation) ──────────────────────────────

export function useSupervisors() {
  return useQuery({
    queryKey: ["supervisors-list"],
    queryFn: async () => {
      let page = 1;
      let lastPage = 1;
      const all: { id: number; name: string; email: string }[] = [];
      while (page <= lastPage) {
        const res = await api.get<ApiResponse<{ id: number; name: string; email: string; roles?: { name: string }[] }[]>>(
          "/users",
          { params: { per_page: 100, page } }
        );
        all.push(
          ...res.data.data
            .filter((u) => u.roles?.some((r) => r.name === "supervisor"))
            .map((u) => ({ id: u.id, name: u.name, email: u.email }))
        );
        const pagination = (res.data.meta as { pagination?: { last_page?: number } })?.pagination;
        lastPage = pagination?.last_page ?? 1;
        page += 1;
      }
      return all;
    },
    staleTime: 5 * 60_000,
  });
}

// ─── Activity Logs ────────────────────────────────────────────────────────────

export interface ActivityLog {
  id: number;
  user_id: number | null;
  action: string;
  description: string;
  metadata: Record<string, unknown>;
  created_at: string;
}

interface ActivityLogsResponse {
  data: ActivityLog[];
  meta: {
    pagination?: {
      current_page: number;
      last_page: number;
      per_page: number;
      total: number;
    };
  };
}

export function useActivityLogs(action?: string, perPage = 25) {
  return useQuery({
    queryKey: ["activity-logs", action ?? "all", perPage],
    queryFn: async () => {
      const params: Record<string, unknown> = { per_page: perPage };
      if (action) params.action = action;
      const res = await api.get<ActivityLogsResponse>("/activity-logs", { params });
      return res.data;
    },
    staleTime: 30_000,
  });
}
