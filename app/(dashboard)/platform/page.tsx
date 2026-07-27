"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Building2, Loader2, Plus, Shield } from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import { useAuthStore } from "@/lib/stores/authStore";
import type { ApiResponse, PlatformOrganization } from "@/lib/types";

export default function PlatformPage() {
  const router = useRouter();
  const isSuperAdmin = useAuthStore((s) => s.user?.is_super_admin);
  const queryClient = useQueryClient();

  const [showCreate, setShowCreate] = useState(false);
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");

  const { data: orgs, isLoading } = useQuery({
    queryKey: ["platform", "organizations"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PlatformOrganization[]>>("/platform/organizations", {
        params: { per_page: 100 },
      });
      return res.data.data;
    },
    enabled: Boolean(isSuperAdmin),
  });

  const createMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<ApiResponse<{ organization: PlatformOrganization }>>("/platform/organizations", {
        name,
        slug: slug || undefined,
        admin_name: adminName || undefined,
        admin_email: adminEmail,
      });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Organization created");
      setShowCreate(false);
      setName("");
      setSlug("");
      setAdminName("");
      setAdminEmail("");
      queryClient.invalidateQueries({ queryKey: ["platform", "organizations"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to create organization")),
  });

  const suspendMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number; status: string }) => {
      const res = await api.patch<ApiResponse<PlatformOrganization>>(`/platform/organizations/${id}`, { status });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Organization updated");
      queryClient.invalidateQueries({ queryKey: ["platform", "organizations"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to update organization")),
  });

  if (!isSuperAdmin) {
    return (
      <div className="flex flex-col items-center justify-center py-24" style={{ gap: 12 }}>
        <Shield size={32} className="text-[#9ca3af]" />
        <p className="text-[14px] font-bold text-(--text-primary)">Platform access required</p>
        <button onClick={() => router.push("/dashboard")} className="text-[13px] text-[#33084E] font-bold">
          Back to dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ gap: 20, padding: 24 }}>
      <div className="flex items-center justify-between flex-wrap" style={{ gap: 12 }}>
        <div>
          <h1 className="text-[22px] font-bold text-(--text-primary)">Platform</h1>
          <p className="text-[13px] text-[#9ca3af]">Create and manage organizations</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="rounded-xl text-white text-[13px] font-bold flex items-center"
          style={{ padding: "10px 14px", gap: 8, background: "#33084E" }}
        >
          <Plus size={15} /> New organization
        </button>
      </div>

      {showCreate && (
        <div className="rounded-2xl border border-[#f0f0f5] bg-white" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 12 }}>
          <p className="text-[14px] font-bold text-(--text-primary)">Create organization</p>
          <div className="grid gap-3" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))" }}>
            <Field label="Organization name">
              <input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder="Acme Corp" />
            </Field>
            <Field label="Slug (optional)">
              <input value={slug} onChange={(e) => setSlug(e.target.value)} className={inputCls} placeholder="acme-corp" />
            </Field>
            <Field label="First admin name">
              <input value={adminName} onChange={(e) => setAdminName(e.target.value)} className={inputCls} placeholder="Jane Doe" />
            </Field>
            <Field label="First admin email *">
              <input value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} className={inputCls} placeholder="admin@acme.com" type="email" />
            </Field>
          </div>
          <div className="flex justify-end" style={{ gap: 8 }}>
            <button onClick={() => setShowCreate(false)} className="text-[12px] font-bold text-[#9ca3af]" style={{ padding: "8px 12px" }}>
              Cancel
            </button>
            <button
              disabled={!name.trim() || !adminEmail.trim() || createMutation.isPending}
              onClick={() => createMutation.mutate()}
              className="rounded-xl text-white text-[12px] font-bold disabled:opacity-50 flex items-center"
              style={{ padding: "8px 14px", gap: 6, background: "#33084E" }}
            >
              {createMutation.isPending && <Loader2 size={14} className="animate-spin" />}
              Create
            </button>
          </div>
        </div>
      )}

      <div className="rounded-2xl border border-[#f0f0f5] bg-white overflow-hidden">
        {isLoading ? (
          <div className="flex justify-center py-16"><Loader2 className="animate-spin text-[#33084E]" /></div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-[#f8f8fc] text-[11px] uppercase tracking-wider text-[#9ca3af]">
              <tr>
                <th style={{ padding: "12px 16px" }}>Organization</th>
                <th style={{ padding: "12px 16px" }}>Members</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px" }}></th>
              </tr>
            </thead>
            <tbody>
              {(orgs ?? []).map((org) => (
                <tr key={org.id} className="border-t border-[#f0f0f5]">
                  <td style={{ padding: "14px 16px" }}>
                    <div className="flex items-center" style={{ gap: 10 }}>
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center text-white text-[12px] font-bold" style={{ background: "#33084E" }}>
                        {org.name.charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-(--text-primary)">{org.name}</p>
                        <p className="text-[11px] text-[#9ca3af]">{org.slug}</p>
                      </div>
                    </div>
                  </td>
                  <td style={{ padding: "14px 16px" }} className="text-[13px] text-(--text-primary)">
                    {org.memberships_count ?? 0}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <span
                      className="rounded-full text-[10px] font-bold capitalize"
                      style={{
                        padding: "2px 8px",
                        background: org.status === "active" ? "#dcfce7" : "#fee2e2",
                        color: org.status === "active" ? "#166534" : "#991b1b",
                      }}
                    >
                      {org.status}
                    </span>
                  </td>
                  <td style={{ padding: "14px 16px" }} className="text-right">
                    <div className="flex items-center justify-end" style={{ gap: 12 }}>
                      <button
                        onClick={() => router.push(`/platform/${org.id}`)}
                        className="text-[12px] font-bold text-[#33084E]"
                      >
                        View
                      </button>
                      <button
                        onClick={() =>
                          suspendMutation.mutate({
                            id: org.id,
                            status: org.status === "active" ? "suspended" : "active",
                          })
                        }
                        className="text-[12px] font-bold text-[#33084E]"
                      >
                        {org.status === "active" ? "Suspend" : "Activate"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {(orgs ?? []).length === 0 && (
                <tr>
                  <td colSpan={4} style={{ padding: 40 }} className="text-center text-[#9ca3af]">
                    <Building2 size={24} className="mx-auto mb-2 opacity-50" />
                    No organizations yet
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}

const inputCls =
  "w-full rounded-xl border border-[#f0f0f5] bg-white text-[13px] outline-none focus:border-[#33084E]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col" style={{ gap: 4 }}>
      <label className="text-[11px] font-bold uppercase text-[#9ca3af]">{label}</label>
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<{ style?: React.CSSProperties }>, {
            style: { padding: "10px 12px", ...((children as React.ReactElement<{ style?: React.CSSProperties }>).props.style ?? {}) },
          })
        : children}
    </div>
  );
}
