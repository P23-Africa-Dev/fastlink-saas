"use client";

import React, { useState } from "react";
import { X, Pencil } from "lucide-react";
import { ModalButton } from "../../crm/components/ModalButton";
import { User, UserRole, USER_ROLES, ROLE_CONFIG } from "./types";
import { CustomSelect } from "@/components/ui/CustomSelect";

interface EditUserModalProps {
  user:     User;
  onClose:  () => void;
  onSave:   (data: { name: string; role: UserRole; suspended: boolean; department?: string }) => void;
}

const DEPARTMENTS = ["Engineering", "Operations", "Sales", "Marketing", "Design", "Support", "Product", "Finance"];

export function EditUserModal({ user, onClose, onSave }: EditUserModalProps) {
  const [name,       setName]       = useState(user.name);
  const [role,       setRole]       = useState<UserRole>(user.role);
  const [suspended,  setSuspended]  = useState(user.suspended);
  const [department, setDepartment] = useState(user.department ?? "");

  const valid   = name.trim().length > 0;
  const changed = name !== user.name || role !== user.role || suspended !== user.suspended || department !== (user.department ?? "");

  const inputCls = "w-full rounded-xl border border-[#f0f0f5] text-[13px] font-medium outline-none focus:border-[#33084E] transition-colors placeholder:text-[#9ca3af] text-(--text-primary)";

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
      style={{ padding: "16px" }}
      onClick={e => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="bg-white rounded-2xl w-full flex flex-col shadow-2xl overflow-hidden" style={{ maxWidth: "500px", maxHeight: "90vh" }}>

        {/* Header */}
        <div className="flex items-center justify-between border-b border-[#f0f0f5] bg-[#f8f8fc] shrink-0" style={{ padding: "18px 22px" }}>
          <div className="flex items-center" style={{ gap: "10px" }}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#f3e8ff" }}>
              <Pencil size={14} style={{ color: "#33084E" }} />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-(--text-primary)">Edit User</h2>
              <p className="text-[11px] text-[#9ca3af]">Updating — {user.name}</p>
            </div>
          </div>
          <div className="flex items-center" style={{ gap: "8px" }}>
            {/* Live avatar preview */}
            <div className="rounded-xl flex items-center justify-center text-[11px] font-bold text-white" style={{ width: "32px", height: "32px", background: user.color }}>
              {user.initials}
            </div>
            <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-(--text-primary) hover:bg-[#f0f0f5] transition-all">
              <X size={16} />
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "22px" }}>
          <div className="flex flex-col" style={{ gap: "18px" }}>

            {/* Name */}
            <div className="flex flex-col" style={{ gap: "6px" }}>
              <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                className={inputCls}
                style={{ padding: "11px 14px" }}
              />
            </div>

            {/* Email (read-only) */}
            <div className="flex flex-col" style={{ gap: "6px" }}>
              <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Email Address <span className="normal-case font-medium text-[#9ca3af]">(cannot be changed)</span></label>
              <div className="rounded-xl border border-[#f0f0f5] bg-[#f8f8fc] text-[13px] font-medium text-[#9ca3af]" style={{ padding: "11px 14px" }}>
                {user.email}
              </div>
            </div>

            {/* Role */}
            <div className="flex flex-col" style={{ gap: "8px" }}>
              <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Role</label>
              <div className="flex flex-col rounded-xl border border-[#f0f0f5] overflow-hidden">
                {USER_ROLES.map((r, i) => {
                  const cfg    = ROLE_CONFIG[r];
                  const active = role === r;
                  return (
                    <button
                      key={r}
                      onClick={() => setRole(r)}
                      className="flex items-center justify-between text-left hover:bg-[#f8f8fc] transition-colors"
                      style={{ padding: "12px 16px", borderTop: i > 0 ? "1px solid #f0f0f5" : "none", background: active ? cfg.bg + "55" : "white" }}
                    >
                      <div className="flex flex-col" style={{ gap: "2px" }}>
                        <span className="text-[13px] font-bold" style={{ color: active ? cfg.color : "#374151" }}>{cfg.label}</span>
                        <span className="text-[11px] text-[#9ca3af]">{cfg.description}</span>
                      </div>
                      <div
                        className="rounded-full flex items-center justify-center shrink-0"
                        style={{ width: "18px", height: "18px", background: active ? cfg.color : "#f0f0f5", border: `1.5px solid ${active ? cfg.color : "#d1d5db"}` }}
                      >
                        {active && <div className="rounded-full bg-white" style={{ width: "6px", height: "6px" }} />}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Department */}
            <div className="flex flex-col" style={{ gap: "6px" }}>
              <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Department</label>
              <CustomSelect
                fullWidth
                value={department}
                onChange={setDepartment}
                options={[
                  { value: "", label: "No department" },
                  ...DEPARTMENTS.map(d => ({ value: d, label: d })),
                ]}
                searchPlaceholder="Search departments…"
              />
            </div>

            {/* Account status toggle */}
            <div className="flex items-center justify-between rounded-xl border border-[#f0f0f5]" style={{ padding: "14px 16px" }}>
              <div className="flex flex-col" style={{ gap: "2px" }}>
                <span className="text-[13px] font-bold text-(--text-primary)">Account Suspended</span>
                <span className="text-[11px] text-[#9ca3af]">Suspending prevents login and all access</span>
              </div>
              <button
                onClick={() => setSuspended(s => !s)}
                className="relative rounded-full transition-all shrink-0"
                style={{
                  width: "42px", height: "24px",
                  background: suspended ? "#dc2626" : "#d1d5db",
                }}
              >
                <span
                  className="absolute top-1 rounded-full bg-white transition-all"
                  style={{ width: "16px", height: "16px", left: suspended ? "22px" : "4px" }}
                />
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#f0f0f5] bg-[#f8f8fc] shrink-0" style={{ padding: "14px 22px" }}>
          <span className="text-[12px] text-[#9ca3af]">{changed ? "Unsaved changes" : "No changes"}</span>
          <div className="flex items-center" style={{ gap: "8px" }}>
            <ModalButton variant="secondary" onClick={onClose} style={{ padding: "8px 16px" }}>Cancel</ModalButton>
            <ModalButton
              variant="primary"
              disabled={!valid || !changed}
              onClick={() => valid && changed && onSave({ name, role, suspended, department: department || undefined })}
              style={{ padding: "8px 16px", opacity: valid && changed ? 1 : 0.5, cursor: valid && changed ? "pointer" : "not-allowed" }}
            >
              Save Changes
            </ModalButton>
          </div>
        </div>
      </div>
    </div>
  );
}
