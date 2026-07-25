"use client";

import React, { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { Loader2, Building2 } from "lucide-react";
import api from "@/lib/api";
import { getApiErrorMessage } from "@/lib/apiError";
import { useAuthStore } from "@/lib/stores/authStore";
import type { ApiResponse, CurrentUser, LoginResponseData, OrganizationSummary } from "@/lib/types";

interface InvitePreview {
  email: string;
  role: string;
  organization: OrganizationSummary;
  expires_at: string;
  user_exists: boolean;
}

function AcceptInviteForm() {
  const router = useRouter();
  const params = useSearchParams();
  const token = params.get("token") ?? "";
  const setAuth = useAuthStore((s) => s.setAuth);

  const [preview, setPreview] = useState<InvitePreview | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [passwordConfirmation, setPasswordConfirmation] = useState("");

  useEffect(() => {
    if (!token) {
      setError("Missing invitation token.");
      setLoading(false);
      return;
    }

    api
      .get<ApiResponse<InvitePreview>>("/invitations/preview", { params: { token } })
      .then((res) => {
        setPreview(res.data.data);
        setName(res.data.data.email.split("@")[0] ?? "");
      })
      .catch((err) => setError(getApiErrorMessage(err, "Invalid invitation.")))
      .finally(() => setLoading(false));
  }, [token]);

  const handleAccept = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;
    setSubmitting(true);
    setError("");
    try {
      const payload: Record<string, string> = { token };
      if (!preview?.user_exists) {
        if (password.length < 8) {
          setError("Password must be at least 8 characters.");
          setSubmitting(false);
          return;
        }
        if (password !== passwordConfirmation) {
          setError("Passwords do not match.");
          setSubmitting(false);
          return;
        }
        payload.name = name;
        payload.password = password;
        payload.password_confirmation = passwordConfirmation;
      }

      const res = await api.post<ApiResponse<LoginResponseData & { user: CurrentUser }>>(
        "/invitations/accept",
        payload
      );
      const { token: authToken, user } = res.data.data;
      setAuth(authToken, user);
      router.push("/dashboard");
    } catch (err) {
      setError(getApiErrorMessage(err, "Failed to accept invitation."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#f8f8fc]" style={{ padding: 24 }}>
      <div className="w-full max-w-md bg-white rounded-2xl border border-[#f0f0f5] shadow-sm" style={{ padding: 28 }}>
        <div className="flex items-center" style={{ gap: 12, marginBottom: 20 }}>
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#f3e8ff" }}>
            <Building2 size={22} style={{ color: "#33084E" }} />
          </div>
          <div>
            <h1 className="text-[18px] font-bold text-(--text-primary)">Accept invitation</h1>
            <p className="text-[12px] text-[#9ca3af]">Join your team workspace on FastLink</p>
          </div>
        </div>

        {loading && (
          <div className="flex justify-center py-10">
            <Loader2 className="animate-spin" style={{ color: "#33084E" }} />
          </div>
        )}

        {!loading && error && !preview && (
          <p className="text-[13px] text-red-600 bg-red-50 rounded-xl" style={{ padding: 12 }}>{error}</p>
        )}

        {!loading && preview && (
          <form onSubmit={handleAccept} className="flex flex-col" style={{ gap: 14 }}>
            <div className="rounded-xl bg-[#f8f8fc] border border-[#f0f0f5]" style={{ padding: 14 }}>
              <p className="text-[12px] text-[#9ca3af]">Organization</p>
              <p className="text-[15px] font-bold text-(--text-primary)">{preview.organization.name}</p>
              <p className="text-[12px] text-[#6b7280]" style={{ marginTop: 4 }}>
                Invited as <span className="font-bold capitalize">{preview.role}</span> · {preview.email}
              </p>
            </div>

            {!preview.user_exists && (
              <>
                <div className="flex flex-col" style={{ gap: 6 }}>
                  <label className="text-[11px] font-bold uppercase text-[#9ca3af]">Your name</label>
                  <input
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="rounded-xl border border-[#f0f0f5] text-[13px] outline-none focus:border-[#33084E]"
                    style={{ padding: "10px 12px" }}
                    required
                  />
                </div>
                <div className="flex flex-col" style={{ gap: 6 }}>
                  <label className="text-[11px] font-bold uppercase text-[#9ca3af]">Password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="rounded-xl border border-[#f0f0f5] text-[13px] outline-none focus:border-[#33084E]"
                    style={{ padding: "10px 12px" }}
                    required
                    minLength={8}
                  />
                </div>
                <div className="flex flex-col" style={{ gap: 6 }}>
                  <label className="text-[11px] font-bold uppercase text-[#9ca3af]">Confirm password</label>
                  <input
                    type="password"
                    value={passwordConfirmation}
                    onChange={(e) => setPasswordConfirmation(e.target.value)}
                    className="rounded-xl border border-[#f0f0f5] text-[13px] outline-none focus:border-[#33084E]"
                    style={{ padding: "10px 12px" }}
                    required
                    minLength={8}
                  />
                </div>
              </>
            )}

            {preview.user_exists && (
              <p className="text-[12px] text-[#6b7280]">
                You already have a FastLink account. Accepting will add this workspace to your account.
              </p>
            )}

            {error && <p className="text-[12px] text-red-600">{error}</p>}

            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl text-white font-bold text-[14px] disabled:opacity-50 flex items-center justify-center"
              style={{ padding: 12, background: "#33084E", gap: 8 }}
            >
              {submitting && <Loader2 size={16} className="animate-spin" />}
              {preview.user_exists ? "Join workspace" : "Create account & join"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function AcceptInvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-[#9ca3af]">Loading…</div>}>
      <AcceptInviteForm />
    </Suspense>
  );
}
