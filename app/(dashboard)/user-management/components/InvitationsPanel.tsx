"use client";

import React, { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Mail, Trash2 } from "lucide-react";
import { toast } from "sonner";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import type { ApiResponse } from "@/lib/types";

interface Invitation {
  id: number;
  email: string;
  role: string;
  expires_at: string;
  created_at: string;
}

export function InvitationsPanel() {
  const queryClient = useQueryClient();
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"admin" | "supervisor" | "staff">("staff");

  const { data: invitations = [], isLoading } = useQuery({
    queryKey: ["org-invitations"],
    queryFn: async () => {
      const res = await api.get<ApiResponse<Invitation[]>>("/organizations/invitations");
      return res.data.data;
    },
  });

  const inviteMutation = useMutation({
    mutationFn: async () => {
      const res = await api.post<ApiResponse<Invitation>>("/organizations/invitations", { email, role });
      return res.data.data;
    },
    onSuccess: () => {
      toast.success("Invitation sent");
      setEmail("");
      queryClient.invalidateQueries({ queryKey: ["org-invitations"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to send invitation")),
  });

  const revokeMutation = useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/organizations/invitations/${id}`);
    },
    onSuccess: () => {
      toast.success("Invitation revoked");
      queryClient.invalidateQueries({ queryKey: ["org-invitations"] });
    },
    onError: (err) => toast.error(getApiErrorMessage(err, "Failed to revoke invitation")),
  });

  return (
    <div className="rounded-2xl border border-[#f0f0f5] bg-white" style={{ padding: 20, display: "flex", flexDirection: "column", gap: 14 }}>
      <div>
        <h3 className="text-[14px] font-bold text-(--text-primary)">Invite teammates</h3>
        <p className="text-[12px] text-[#9ca3af]">Send an email invite to join this workspace</p>
      </div>

      <div className="flex flex-wrap items-end" style={{ gap: 10 }}>
        <div className="flex flex-col flex-1 min-w-[200px]" style={{ gap: 4 }}>
          <label className="text-[11px] font-bold uppercase text-[#9ca3af]">Email</label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="colleague@company.com"
            className="rounded-xl border border-[#f0f0f5] text-[13px] outline-none focus:border-[#33084E]"
            style={{ padding: "10px 12px" }}
          />
        </div>
        <div className="flex flex-col" style={{ gap: 4, minWidth: 140 }}>
          <label className="text-[11px] font-bold uppercase text-[#9ca3af]">Role</label>
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as typeof role)}
            className="rounded-xl border border-[#f0f0f5] text-[13px] outline-none focus:border-[#33084E]"
            style={{ padding: "10px 12px" }}
          >
            <option value="staff">Staff</option>
            <option value="supervisor">Supervisor</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        <button
          disabled={!email.trim() || inviteMutation.isPending}
          onClick={() => inviteMutation.mutate()}
          className="rounded-xl text-white text-[12px] font-bold disabled:opacity-50 flex items-center"
          style={{ padding: "10px 14px", gap: 6, background: "#33084E" }}
        >
          {inviteMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <Mail size={14} />}
          Send invite
        </button>
      </div>

      {isLoading ? (
        <div className="py-4 flex justify-center"><Loader2 className="animate-spin text-[#33084E]" size={18} /></div>
      ) : invitations.length === 0 ? (
        <p className="text-[12px] text-[#9ca3af]">No pending invitations</p>
      ) : (
        <ul className="flex flex-col" style={{ gap: 8 }}>
          {invitations.map((inv) => (
            <li key={inv.id} className="flex items-center justify-between rounded-xl bg-[#f8f8fc] border border-[#f0f0f5]" style={{ padding: "10px 12px" }}>
              <div>
                <p className="text-[13px] font-bold text-(--text-primary)">{inv.email}</p>
                <p className="text-[11px] text-[#9ca3af] capitalize">
                  {inv.role} · expires {new Date(inv.expires_at).toLocaleDateString()}
                </p>
              </div>
              <button
                onClick={() => revokeMutation.mutate(inv.id)}
                className="w-8 h-8 rounded-lg flex items-center justify-center text-[#9ca3af] hover:text-red-500 hover:bg-red-50"
                title="Revoke"
              >
                <Trash2 size={14} />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
