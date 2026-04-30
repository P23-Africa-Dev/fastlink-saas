"use client";

import React, { useState } from "react";
import { X, Eye, EyeOff, UserPlus } from "lucide-react";
import { ModalButton } from "../../crm/components/ModalButton";
import { UserRole, USER_ROLES, ROLE_CONFIG } from "./types";

interface CreateUserModalProps {
  onClose:  () => void;
  onCreate: (data: { name: string; email: string; password: string; role: UserRole; department?: string }) => void;
}

const DEPARTMENTS = ["Engineering", "Operations", "Sales", "Marketing", "Design", "Support", "Product", "Finance"];

export function CreateUserModal({ onClose, onCreate }: CreateUserModalProps) {
  const [name,       setName]       = useState("");
  const [email,      setEmail]      = useState("");
  const [password,   setPassword]   = useState("");
  const [showPw,     setShowPw]     = useState(false);
  const [role,       setRole]       = useState<UserRole>("staff");
  const [department, setDepartment] = useState("");

  const valid = name.trim() && email.trim() && password.length >= 8;

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
            <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#33084E" }}>
              <UserPlus size={15} className="text-white" />
            </div>
            <div>
              <h2 className="text-[15px] font-bold text-(--text-primary)">Create User</h2>
              <p className="text-[11px] text-[#9ca3af]">Add a new team member</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-[#9ca3af] hover:text-(--text-primary) hover:bg-[#f0f0f5] transition-all">
            <X size={16} />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto" style={{ padding: "22px" }}>
          <div className="flex flex-col" style={{ gap: "18px" }}>

            {/* Name */}
            <div className="flex flex-col" style={{ gap: "6px" }}>
              <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Full Name</label>
              <input
                type="text"
                placeholder="e.g. Jane Smith"
                value={name}
                onChange={e => setName(e.target.value)}
                className={inputCls}
                style={{ padding: "11px 14px" }}
              />
            </div>

            {/* Email */}
            <div className="flex flex-col" style={{ gap: "6px" }}>
              <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Email Address</label>
              <input
                type="email"
                placeholder="jane@company.com"
                value={email}
                onChange={e => setEmail(e.target.value)}
                className={inputCls}
                style={{ padding: "11px 14px" }}
              />
            </div>

            {/* Password */}
            <div className="flex flex-col" style={{ gap: "6px" }}>
              <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  placeholder="Min. 8 characters"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  className={inputCls}
                  style={{ padding: "11px 40px 11px 14px" }}
                />
                <button
                  type="button"
                  onClick={() => setShowPw(p => !p)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-(--text-primary) transition-colors"
                >
                  {showPw ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
              {/* Strength indicator */}
              {password.length > 0 && (
                <div className="flex items-center" style={{ gap: "6px" }}>
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className="flex-1 rounded-full"
                      style={{
                        height: "3px",
                        background: password.length >= i * 3
                          ? password.length < 6  ? "#dc2626"
                          : password.length < 10 ? "#d97706"
                          : "#16a34a"
                          : "#f0f0f5",
                      }}
                    />
                  ))}
                  <span className="text-[10px] font-bold" style={{ color: password.length < 6 ? "#dc2626" : password.length < 10 ? "#d97706" : "#16a34a", minWidth: "30px" }}>
                    {password.length < 6 ? "Weak" : password.length < 10 ? "Fair" : "Strong"}
                  </span>
                </div>
              )}
            </div>

            {/* Role pills */}
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
                      style={{ padding: "12px 16px", borderTop: i > 0 ? "1px solid #f0f0f5" : "none" }}
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
              <label className="text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider">
                Department <span className="normal-case font-medium">(optional)</span>
              </label>
              <select
                value={department}
                onChange={e => setDepartment(e.target.value)}
                className={inputCls}
                style={{ padding: "11px 14px" }}
              >
                <option value="">Select department…</option>
                {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between border-t border-[#f0f0f5] bg-[#f8f8fc] shrink-0" style={{ padding: "14px 22px" }}>
          <span className="text-[12px] text-[#9ca3af]">{valid ? `${ROLE_CONFIG[role].label} · ${department || "No department"}` : "Fill required fields"}</span>
          <div className="flex items-center" style={{ gap: "8px" }}>
            <ModalButton variant="secondary" onClick={onClose} style={{ padding: "8px 16px" }}>Cancel</ModalButton>
            <ModalButton
              variant="primary"
              disabled={!valid}
              onClick={() => valid && onCreate({ name, email, password, role, department: department || undefined })}
              style={{ padding: "8px 16px", opacity: valid ? 1 : 0.5, cursor: valid ? "pointer" : "not-allowed" }}
            >
              Create User
            </ModalButton>
          </div>
        </div>
      </div>
    </div>
  );
}
