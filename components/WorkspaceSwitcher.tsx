"use client";

import React, { useState, useRef, useEffect } from "react";
import { Check, ChevronsUpDown, Building2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import { useAuthStore } from "@/lib/stores/authStore";
import type { ApiResponse, CurrentUser } from "@/lib/types";

export function WorkspaceSwitcher({ compact = false }: { compact?: boolean }) {
  const user = useAuthStore((s) => s.user);
  const currentOrganizationId = useAuthStore((s) => s.currentOrganizationId);
  const setUser = useAuthStore((s) => s.setUser);
  const setCurrentOrganizationId = useAuthStore((s) => s.setCurrentOrganizationId);
  const organizations = user?.organizations ?? [];

  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const current = organizations.find((o) => o.id === currentOrganizationId) ?? user?.current_organization ?? null;

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const switchOrg = async (orgId: number) => {
    if (orgId === currentOrganizationId || switching) return;
    setSwitching(true);
    try {
      const res = await api.post<ApiResponse<CurrentUser>>(`/auth/organizations/${orgId}/switch`);
      setUser(res.data.data);
      setCurrentOrganizationId(res.data.data.current_organization_id ?? orgId);
      setOpen(false);
      toast.success(`Switched to ${res.data.data.current_organization?.name ?? "workspace"}`);
      // Reload so all org-scoped queries refresh cleanly
      window.location.reload();
    } catch (err) {
      toast.error(getApiErrorMessage(err, "Failed to switch workspace"));
    } finally {
      setSwitching(false);
    }
  };

  if (organizations.length === 0) {
    return (
      <div className="flex items-center gap-2 text-[12px] text-[#9ca3af]">
        <Building2 size={14} />
        {!compact && <span>No workspace</span>}
      </div>
    );
  }

  const initial = (current?.name ?? "W").charAt(0).toUpperCase();

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex items-center w-full rounded-xl border border-[#f0f0f5] bg-white hover:border-[#d1d5db] transition-all"
        style={{ padding: compact ? "6px 8px" : "8px 10px", gap: "8px" }}
        title={current?.name ?? "Workspace"}
      >
        <div
          className="rounded-lg flex items-center justify-center text-white text-[12px] font-bold shrink-0"
          style={{ width: 28, height: 28, background: "#33084E" }}
        >
          {initial}
        </div>
        {!compact && (
          <div className="flex-1 min-w-0 text-left">
            <p className="text-[12px] font-bold text-(--text-primary) truncate">{current?.name ?? "Workspace"}</p>
            <p className="text-[10px] text-[#9ca3af] capitalize truncate">{current?.role ?? ""}</p>
          </div>
        )}
        {switching ? <Loader2 size={14} className="animate-spin text-[#9ca3af]" /> : <ChevronsUpDown size={14} className="text-[#9ca3af] shrink-0" />}
      </button>

      {open && (
        <div
          className="absolute left-0 right-0 z-50 mt-1 rounded-xl border border-[#f0f0f5] bg-white shadow-lg overflow-hidden"
          style={{ minWidth: compact ? 220 : undefined }}
        >
          <div className="px-3 py-2 border-b border-[#f0f0f5]">
            <p className="text-[10px] font-bold uppercase tracking-wider text-[#9ca3af]">Workspaces</p>
          </div>
          <div className="max-h-64 overflow-y-auto py-1">
            {organizations.map((org) => {
              const active = org.id === currentOrganizationId;
              return (
                <button
                  key={org.id}
                  type="button"
                  onClick={() => switchOrg(org.id)}
                  className="w-full flex items-center text-left hover:bg-[#f8f8fc] transition-colors"
                  style={{ padding: "8px 12px", gap: "8px" }}
                >
                  <div
                    className="rounded-md flex items-center justify-center text-white text-[11px] font-bold shrink-0"
                    style={{ width: 24, height: 24, background: active ? "#33084E" : "#9ca3af" }}
                  >
                    {org.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-[12px] font-bold text-(--text-primary) truncate">{org.name}</p>
                    <p className="text-[10px] text-[#9ca3af] capitalize">{org.role}</p>
                  </div>
                  {active && <Check size={14} style={{ color: "#33084E" }} />}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
