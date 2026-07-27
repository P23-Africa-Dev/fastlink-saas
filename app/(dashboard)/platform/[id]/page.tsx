"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  AlertTriangle,
  ArrowLeft,
  Building2,
  Loader2,
  Pencil,
  Shield,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import { useAuthStore } from "@/lib/stores/authStore";
import type {
  ApiResponse,
  PlatformOrganization,
  PlatformOrganizationDetail,
  PlatformOrganizationMember,
} from "@/lib/types";
import { ModalButton } from "@/app/(dashboard)/project/components/ModalButton";

const inputCls =
  "w-full rounded-xl border border-[#f0f0f5] bg-white text-[13px] outline-none focus:border-[#33084E]";

export default function PlatformOrganizationDetailPage() {
  const router = useRouter();
  const params = useParams();
  const orgId = Number(params.id);
  const isSuperAdmin = useAuthStore((s) => s.user?.is_super_admin);
  const queryClient = useQueryClient();

  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);

  const [editName, setEditName] = useState("");
  const [editSlug, setEditSlug] = useState("");
  const [editTimezone, setEditTimezone] = useState("");
  const [editStatus, setEditStatus] = useState("active");
  const [confirmSlug, setConfirmSlug] = useState("");

  const { data: detail, isLoading, isError } = useQuery({
    queryKey: ["platform", "organizations", orgId],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PlatformOrganizationDetail>>(
        `/platform/organizations/${orgId}`
      );
      return res.data.data;
    },
    enabled: Boolean(isSuperAdmin) && Number.isFinite(orgId),
  });

  const { data: members, isLoading: membersLoading } = useQuery({
    queryKey: ["platform", "organizations", orgId, "members"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<PlatformOrganizationMember[]>>(
        `/platform/organizations/${orgId}/members`
      );
      return res.data.data;
    },
    enabled: Boolean(isSuperAdmin) && Number.isFinite(orgId),
  });

  const org = detail?.organization;

  useEffect(() => {
    if (!org) return;
    setEditName(org.name);
    setEditSlug(org.slug);
    setEditTimezone(org.timezone ?? "");
    setEditStatus(org.status);
  }, [org]);

  const updateMutation = useMutation({
    mutationFn: async () => {
      const res = await api.patch<ApiResponse<PlatformOrganization>>(
        `/platform/organizations/${orgId}`,
        {
          name: editName,
          slug: editSlug,
          timezone: editTimezone || null,
          status: editStatus,
        }
      );
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Organization updated");
      setShowEdit(false);
      queryClient.invalidateQueries({ queryKey: ["platform", "organizations"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to update organization")),
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      await api.delete(`/platform/organizations/${orgId}`, {
        data: { confirm_slug: confirmSlug },
      });
    },
    onSuccess: () => {
      toast.success("Organization deleted");
      queryClient.invalidateQueries({ queryKey: ["platform", "organizations"] });
      router.push("/platform");
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to delete organization")),
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

  if (!Number.isFinite(orgId)) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[#9ca3af]">
        <p>Invalid organization</p>
        <Link href="/platform" className="text-[13px] text-[#33084E] font-bold mt-2">
          Back to platform
        </Link>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex justify-center py-24">
        <Loader2 className="animate-spin text-[#33084E]" />
      </div>
    );
  }

  if (isError || !detail || !org) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-[#9ca3af]" style={{ gap: 8 }}>
        <p>Organization not found</p>
        <Link href="/platform" className="text-[13px] text-[#33084E] font-bold">
          Back to platform
        </Link>
      </div>
    );
  }

  const stats = detail.stats;
  const isFastlink = org.slug === "fastlink";

  return (
    <div className="flex flex-col" style={{ gap: 20, padding: 24 }}>
      <div className="flex items-center flex-wrap" style={{ gap: 12 }}>
        <Link
          href="/platform"
          className="flex items-center text-[13px] font-bold text-[#9ca3af] hover:text-[#33084E]"
          style={{ gap: 6 }}
        >
          <ArrowLeft size={16} />
          Platform
        </Link>
      </div>

      <div className="rounded-2xl border border-[#f0f0f5] bg-white" style={{ padding: 24 }}>
        <div className="flex items-start justify-between flex-wrap" style={{ gap: 16 }}>
          <div className="flex items-start" style={{ gap: 14 }}>
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-white text-[16px] font-bold shrink-0"
              style={{ background: "#33084E" }}
            >
              {org.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h1 className="text-[22px] font-bold text-(--text-primary)">{org.name}</h1>
              <p className="text-[13px] text-[#9ca3af]">{org.slug}</p>
              <div className="flex items-center flex-wrap mt-2" style={{ gap: 8 }}>
                <StatusBadge status={org.status} />
                {org.timezone && (
                  <span className="text-[11px] text-[#9ca3af]">{org.timezone}</span>
                )}
                {org.created_at && (
                  <span className="text-[11px] text-[#9ca3af]">
                    Created {new Date(org.created_at).toLocaleDateString()}
                  </span>
                )}
              </div>
              {detail.creator && (
                <p className="text-[12px] text-[#9ca3af] mt-1">
                  Created by {detail.creator.name} ({detail.creator.email})
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center" style={{ gap: 8 }}>
            <button
              onClick={() => setShowEdit(true)}
              className="rounded-xl border border-[#f0f0f5] text-[12px] font-bold flex items-center hover:bg-[#f8f8fc]"
              style={{ padding: "8px 12px", gap: 6, color: "#33084E" }}
            >
              <Pencil size={14} />
              Edit
            </button>
            {!isFastlink && (
              <button
                onClick={() => {
                  setConfirmSlug("");
                  setShowDelete(true);
                }}
                className="rounded-xl text-[12px] font-bold flex items-center text-[#ef4444] border border-[#fecaca] hover:bg-[#fef2f2]"
                style={{ padding: "8px 12px", gap: 6 }}
              >
                <Trash2 size={14} />
                Delete
              </button>
            )}
          </div>
        </div>

        <div
          className="grid mt-6"
          style={{ gridTemplateColumns: "repeat(auto-fill, minmax(120px, 1fr))", gap: 12 }}
        >
          <StatCard label="Members" value={stats.members} />
          <StatCard label="Leads" value={stats.leads} />
          <StatCard label="Projects" value={stats.projects} />
          <StatCard label="Tasks" value={stats.tasks} />
          <StatCard label="Meetings" value={stats.meetings} />
        </div>
      </div>

      <div className="rounded-2xl border border-[#f0f0f5] bg-white overflow-hidden">
        <div style={{ padding: "16px 20px" }} className="border-b border-[#f0f0f5]">
          <h2 className="text-[14px] font-bold text-(--text-primary)">Members</h2>
        </div>
        {membersLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="animate-spin text-[#33084E]" />
          </div>
        ) : (
          <table className="w-full text-left">
            <thead className="bg-[#f8f8fc] text-[11px] uppercase tracking-wider text-[#9ca3af]">
              <tr>
                <th style={{ padding: "12px 16px" }}>Name</th>
                <th style={{ padding: "12px 16px" }}>Email</th>
                <th style={{ padding: "12px 16px" }}>Role</th>
                <th style={{ padding: "12px 16px" }}>Status</th>
                <th style={{ padding: "12px 16px" }}>Joined</th>
              </tr>
            </thead>
            <tbody>
              {(members ?? []).map((m) => (
                <tr key={m.id} className="border-t border-[#f0f0f5]">
                  <td style={{ padding: "14px 16px" }} className="text-[13px] font-bold text-(--text-primary)">
                    {m.user?.name ?? "—"}
                  </td>
                  <td style={{ padding: "14px 16px" }} className="text-[13px] text-[#9ca3af]">
                    {m.user?.email ?? "—"}
                  </td>
                  <td style={{ padding: "14px 16px" }} className="text-[13px] capitalize text-(--text-primary)">
                    {m.role ?? "—"}
                  </td>
                  <td style={{ padding: "14px 16px" }}>
                    <StatusBadge status={m.status} />
                  </td>
                  <td style={{ padding: "14px 16px" }} className="text-[13px] text-[#9ca3af]">
                    {m.joined_at ? new Date(m.joined_at).toLocaleDateString() : "—"}
                  </td>
                </tr>
              ))}
              {(members ?? []).length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 40 }} className="text-center text-[#9ca3af]">
                    <Building2 size={24} className="mx-auto mb-2 opacity-50" />
                    No members
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {showEdit && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          style={{ padding: 16 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowEdit(false);
          }}
        >
          <div className="bg-white rounded-2xl w-full max-w-md flex flex-col shadow-2xl overflow-hidden">
            <div style={{ padding: "24px 24px 0" }}>
              <h2 className="text-[18px] font-bold text-(--text-primary)">Edit organization</h2>
            </div>
            <div className="flex flex-col" style={{ padding: 20, gap: 12 }}>
              <Field label="Name">
                <input value={editName} onChange={(e) => setEditName(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Slug">
                <input value={editSlug} onChange={(e) => setEditSlug(e.target.value)} className={inputCls} />
              </Field>
              <Field label="Timezone">
                <input
                  value={editTimezone}
                  onChange={(e) => setEditTimezone(e.target.value)}
                  className={inputCls}
                  placeholder="UTC"
                />
              </Field>
              <Field label="Status">
                <select
                  value={editStatus}
                  onChange={(e) => setEditStatus(e.target.value)}
                  className={inputCls}
                >
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </select>
              </Field>
            </div>
            <div
              className="border-t border-[#f0f0f5] flex items-center justify-end bg-[#f8f8fc]"
              style={{ padding: "16px 24px", gap: 12 }}
            >
              <ModalButton variant="secondary" onClick={() => setShowEdit(false)}>
                Cancel
              </ModalButton>
              <ModalButton
                variant="primary"
                disabled={!editName.trim() || updateMutation.isPending}
                onClick={() => updateMutation.mutate()}
              >
                {updateMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                Save changes
              </ModalButton>
            </div>
          </div>
        </div>
      )}

      {showDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          style={{ padding: 16 }}
          onClick={(e) => {
            if (e.target === e.currentTarget) setShowDelete(false);
          }}
        >
          <div className="bg-white rounded-2xl w-full max-w-sm flex flex-col shadow-2xl overflow-hidden">
            <div className="flex flex-col items-center text-center" style={{ padding: "32px 28px", gap: 16 }}>
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center"
                style={{ background: "#fef2f2", color: "#ef4444" }}
              >
                <AlertTriangle size={26} />
              </div>
              <div className="flex flex-col" style={{ gap: 8 }}>
                <h2 className="text-[18px] font-bold text-(--text-primary)">Delete organization?</h2>
                <p className="text-[13px] text-[#9ca3af] leading-relaxed">
                  This will permanently delete{" "}
                  <span className="font-bold text-(--text-primary)">{org.name}</span> and all its CRM data,
                  projects, tasks, and attendance records. This cannot be undone.
                </p>
                <p className="text-[12px] text-[#9ca3af]">
                  Type <span className="font-mono font-bold text-(--text-primary)">{org.slug}</span> to confirm.
                </p>
                <input
                  value={confirmSlug}
                  onChange={(e) => setConfirmSlug(e.target.value)}
                  className={inputCls}
                  placeholder={org.slug}
                  style={{ padding: "10px 12px", marginTop: 4 }}
                />
              </div>
            </div>
            <div
              className="border-t border-[#f0f0f5] flex items-center justify-end bg-[#f8f8fc]"
              style={{ padding: "16px 24px", gap: 12 }}
            >
              <ModalButton variant="secondary" onClick={() => setShowDelete(false)}>
                Cancel
              </ModalButton>
              <ModalButton
                variant="danger"
                disabled={confirmSlug !== org.slug || deleteMutation.isPending}
                onClick={() => deleteMutation.mutate()}
              >
                {deleteMutation.isPending && <Loader2 size={14} className="animate-spin" />}
                Delete organization
              </ModalButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-[#f8f8fc] text-center" style={{ padding: "14px 12px" }}>
      <p className="text-[20px] font-bold text-(--text-primary)">{value}</p>
      <p className="text-[11px] text-[#9ca3af] uppercase tracking-wide">{label}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const active = status === "active";
  return (
    <span
      className="rounded-full text-[10px] font-bold capitalize"
      style={{
        padding: "2px 8px",
        background: active ? "#dcfce7" : "#fee2e2",
        color: active ? "#166534" : "#991b1b",
      }}
    >
      {status}
    </span>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col" style={{ gap: 4 }}>
      <label className="text-[11px] font-bold uppercase text-[#9ca3af]">{label}</label>
      {React.isValidElement(children)
        ? React.cloneElement(children as React.ReactElement<{ style?: React.CSSProperties }>, {
            style: {
              padding: "10px 12px",
              ...((children as React.ReactElement<{ style?: React.CSSProperties }>).props.style ?? {}),
            },
          })
        : children}
    </div>
  );
}
