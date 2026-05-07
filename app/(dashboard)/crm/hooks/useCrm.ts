import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import type { ApiResponse, Lead, Drive, LeadStatus, LocationCountry, LocationLga, LocationState } from "@/lib/types";

// ── Follow-Up Types ───────────────────────────────────────────────────────────

export interface FormSchemaField {
  label: string;
  type: "text" | "textarea" | "radio" | "checkbox" | "select" | "date" | "number";
  required?: boolean;
  options?: string[];
}

export interface FormSchema {
  fields: FormSchemaField[];
}

export interface FollowUpCreator {
  id: number;
  name: string;
}

export interface FollowUpAttachmentData {
  id: number;
  followup_id: number;
  uploaded_by?: number;
  original_filename: string;
  mime_type?: string;
  file_size?: number;
  created_at: string;
  file_url?: string;
  preview_url?: string;
  download_url: string;
}

export interface FollowUpAuditActivity {
  id: number;
  event: string;
  description?: string;
  created_at: string;
}

export interface FollowUpUpdateRequest {
  id: number;
  status: "pending" | "approved" | "rejected";
  requested_by: number;
  reason?: string | null;
  proposed_changes: Record<string, unknown>;
  created_at: string;
}

export interface FollowUp {
  id: number;
  lead_id: number;
  title: string;
  content: Record<string, unknown>;
  form_schema?: FormSchema | null;
  created_at: string;
  updated_at: string;
  creator: FollowUpCreator;
  attachments: FollowUpAttachmentData[];
  activities: FollowUpAuditActivity[];
  update_requests: FollowUpUpdateRequest[];
}

export interface FollowUpUpdateResponse {
  mode: "updated" | "approval_required";
  followup: FollowUp;
  update_request: FollowUpUpdateRequest | null;
}

export interface LeadImportResult {
  imported: number;
  skipped: number;
  errors: string[];
}

export function useDrives() {
  return useQuery({
    queryKey: ["crm", "drives"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Drive[]>>("/crm/drives", { params: { per_page: 100 } });
      return res.data.data;
    },
  });
}

export function useStatuses() {
  return useQuery({
    queryKey: ["crm", "statuses"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<LeadStatus[]>>("/crm/statuses", { params: { per_page: 100 } });
      return res.data.data;
    },
  });
}

export function useIndustries() {
  return useQuery({
    queryKey: ["crm", "industries"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<string[]>>("/industries");
      return res.data.data;
    },
  });
}

export function useCountries() {
  return useQuery({
    queryKey: ["crm", "countries"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<LocationCountry[]>>("/countries");
      return res.data.data;
    },
  });
}

export function useStates(countryId?: number) {
  return useQuery({
    queryKey: ["crm", "states", countryId ?? "default"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<LocationState[]>>("/states", {
        params: { country_id: countryId || undefined },
      });
      return res.data.data;
    },
  });
}

export function useLgas(stateId?: number) {
  return useQuery({
    queryKey: ["crm", "lgas", stateId ?? "none"],
    queryFn: async () => {
      if (!stateId) return [];
      const res = await api.get<ApiResponse<LocationLga[]>>("/lgas", {
        params: { state_id: stateId },
      });
      return res.data.data;
    },
  });
}

export function useLeads(filters: {
  driveId?: number;
  statusId?: number;
  query?: string;
  priority?: string;
  assignedTo?: string;
  countryId?: number;
  stateId?: number;
  lgaId?: number;
}) {
  return useQuery({
    queryKey: ["crm", "leads", filters],
    queryFn: async () => {
      const apiPriority = filters.priority === "normal" ? "medium" : filters.priority || undefined;
      const res = await api.get<ApiResponse<Lead[]>>("/crm/leads", {
        params: {
          drive_id: filters.driveId && filters.driveId > 0 ? filters.driveId : undefined,
          status_id: filters.statusId || undefined,
          q: filters.query || undefined,
          priority: apiPriority,
          assigned_to: filters.assignedTo || undefined,
          country_id: filters.countryId || undefined,
          state_id: filters.stateId || undefined,
          lga_id: filters.lgaId || undefined,
          per_page: 300,
        },
      });
      return res.data.data;
    },
  });
}

export function useCreateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Lead>) => {
      const res = await api.post<ApiResponse<Lead>>("/crm/leads", payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm", "leads"] });
    },
  });
}

export function useUpdateLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<Lead> }) => {
      const res = await api.patch<ApiResponse<Lead>>(`/crm/leads/${id}`, payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm", "leads"] });
    },
  });
}

export function useDeleteLead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/crm/leads/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm", "leads"] });
    },
  });
}

export function useImportLeads() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (formData: FormData): Promise<LeadImportResult> => {
      const res = await api.post<ApiResponse<LeadImportResult>>("/crm/leads/import", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return {
        imported: Number(res.data.data?.imported ?? 0),
        skipped: Number(res.data.data?.skipped ?? 0),
        errors: Array.isArray(res.data.data?.errors) ? res.data.data.errors : [],
      };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm", "leads"] });
    },
  });
}

export function useCreateDrive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<Drive>) => {
      const res = await api.post<ApiResponse<Drive>>("/crm/drives", payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm", "drives"] });
    },
  });
}

export function useUpdateDrive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<Drive> }) => {
      const res = await api.patch<ApiResponse<Drive>>(`/crm/drives/${id}`, payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm", "drives"] });
    },
  });
}

export function useDeleteDrive() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/crm/drives/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm", "drives"] });
    },
  });
}

export function useCreateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (payload: Partial<LeadStatus>) => {
      const res = await api.post<ApiResponse<LeadStatus>>("/crm/statuses", payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm", "statuses"] });
    },
  });
}

export function useUpdateStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: number; payload: Partial<LeadStatus> }) => {
      const res = await api.patch<ApiResponse<LeadStatus>>(`/crm/statuses/${id}`, payload);
      return res.data.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm", "statuses"] });
    },
  });
}

export function useDeleteStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/crm/statuses/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["crm", "statuses"] });
    },
  });
}

// ── Follow-Up Hooks ───────────────────────────────────────────────────────────

export function useFollowUps(leadId: number) {
  return useQuery({
    queryKey: ["crm", "followups", leadId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<FollowUp[]>>(`/crm/leads/${leadId}/followups`, {
        params: { per_page: 50 },
      });
      return res.data.data;
    },
    enabled: !!leadId,
  });
}

export function useCreateFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ leadId, payload }: { leadId: number; payload: FormData | Record<string, unknown> }) => {
      const res = await api.post<ApiResponse<FollowUp>>(`/crm/leads/${leadId}/followups`, payload);

      return res.data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["crm", "followups", variables.leadId] });
    },
  });
}

export function useUpdateFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, leadId, payload }: { id: number; leadId: number; payload: FormData | Record<string, unknown> }) => {
      const isFormData = payload instanceof FormData;

      if (isFormData) {
        const formDataPayload = payload as FormData;

        // PHP reliably parses uploaded files on multipart POST. `_method=PUT`
        // preserves route semantics while keeping file uploads intact.
        if (!formDataPayload.has("_method")) {
          formDataPayload.append("_method", "PUT");
        }

        const res = await api.post<ApiResponse<FollowUpUpdateResponse>>(
          `/crm/followups/${id}`,
          formDataPayload,
        );

        return res.data.data;
      }

      const res = await api.put<ApiResponse<FollowUpUpdateResponse>>(
        `/crm/followups/${id}`,
        payload,
      );

      return res.data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["crm", "followups", variables.leadId] });
    },
  });
}

export function useApproveFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, leadId, reason }: { id: number; leadId: number; reason?: string }) => {
      const res = await api.post<ApiResponse<FollowUp>>(`/crm/followups/${id}/approve`, { reason: reason || undefined });
      return res.data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["crm", "followups", variables.leadId] });
    },
  });
}

export function useRejectFollowUp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, leadId, reason }: { id: number; leadId: number; reason?: string }) => {
      const res = await api.post<ApiResponse<FollowUp>>(`/crm/followups/${id}/reject`, { reason: reason || undefined });
      return res.data.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["crm", "followups", variables.leadId] });
    },
  });
}
