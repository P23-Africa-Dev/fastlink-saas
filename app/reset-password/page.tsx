"use client";

import React, { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { CheckCircle2, Eye, EyeOff, Loader2, Zap } from "lucide-react";
import api from "@/lib/api";
import type { ApiResponse } from "@/lib/types";

interface FormErrors {
  password?: string;
  confirm?: string;
  general?: string;
}

function validate(password: string, confirm: string): FormErrors {
  const errors: FormErrors = {};
  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 8) {
    errors.password = "Password must be at least 8 characters.";
  }
  if (!confirm) {
    errors.confirm = "Please confirm your password.";
  } else if (password !== confirm) {
    errors.confirm = "Passwords do not match.";
  }
  return errors;
}

function passwordStrength(pw: string): number {
  if (!pw) return 0;
  let score = 0;
  if (pw.length >= 8) score++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) score++;
  if (/\d/.test(pw)) score++;
  if (/[^A-Za-z0-9]/.test(pw)) score++;
  return score;
}

const STRENGTH = [
  { label: "", color: "#e5e7eb" },
  { label: "Weak", color: "#dc2626" },
  { label: "Fair", color: "#d97706" },
  { label: "Good", color: "#d97706" },
  { label: "Strong", color: "#16a34a" },
];

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const email = searchParams.get("email") ?? "";

  const [password, setPassword]   = useState("");
  const [confirm, setConfirm]     = useState("");
  const [showPw, setShowPw]       = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors]       = useState<FormErrors>({});
  const [loading, setLoading]     = useState(false);
  const [done, setDone]           = useState(false);

  const linkValid = Boolean(token && email);
  const strength = useMemo(() => passwordStrength(password), [password]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(password, confirm);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      await api.post<ApiResponse<null>>("/auth/reset-password", {
        token,
        email,
        password,
        password_confirmation: confirm,
      });
      setDone(true);
      setTimeout(() => router.push("/"), 2500);
    } catch (err: unknown) {
      const e2 = err as { response?: { status?: number; data?: { message?: string } } };
      const status = e2.response?.status;
      if (status === 429) {
        setErrors({ general: "Too many attempts. Please wait a moment and try again." });
      } else if (status === 422) {
        setErrors({ general: e2.response?.data?.message ?? "This reset link is invalid or has expired." });
      } else {
        setErrors({ general: "Something went wrong. Please try again later." });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">

      {/* Left panel */}
      <div
        className="hidden lg:flex flex-col justify-between w-[48%] p-14 relative overflow-hidden"
        style={{ background: "#33084E" }}
      >
        {/* Subtle diamond pattern overlay */}
        <svg className="absolute inset-0 w-full h-full opacity-[0.06]" xmlns="http://www.w3.org/2000/svg">
          <defs>
            <pattern id="diamonds" x="0" y="0" width="80" height="80" patternUnits="userSpaceOnUse" patternTransform="rotate(15)">
              <rect x="20" y="5" width="40" height="40" fill="none" stroke="white" strokeWidth="1" transform="rotate(45 40 25)" />
            </pattern>
          </defs>
          <rect width="100%" height="100%" fill="url(#diamonds)" />
        </svg>

        {/* Logo */}
        <div className="relative flex items-center gap-3">
          <div className="flex items-center justify-center rounded-xl bg-white/15" style={{ width: "44px", height: "44px" }}>
            <span className="text-white font-bold text-xl tracking-tight">F</span>
          </div>
        </div>

        {/* Hero */}
        <div className="relative flex flex-col" style={{ gap: "20px" }}>
          <h1 className="text-white font-bold leading-tight" style={{ fontSize: "clamp(2.2rem, 3.8vw, 3.2rem)" }}>
            Create a new<br />password
          </h1>
          <p className="text-white/60 text-[15px] leading-relaxed max-w-xs">
            Choose a strong password to keep your FastLink account secure.
          </p>
        </div>

        {/* Footer */}
        <p className="relative text-white/30 text-[12px]">
          &copy; {new Date().getFullYear()} FastLink SaaS. All rights reserved.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col justify-between bg-white p-10 lg:p-16">

        {/* Top — app name (mobile) */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex items-center justify-center rounded-xl" style={{ width: "32px", height: "32px", background: "#33084E" }}>
            <Zap size={15} color="white" fill="white" />
          </div>
          <span className="font-bold text-[15px]" style={{ color: "#33084E" }}>FastLink</span>
        </div>
        <div className="hidden lg:block" />

        {/* Form area */}
        <div className="w-full max-w-sm mx-auto flex flex-col" style={{ gap: "36px" }}>

          {done ? (
            <div className="flex flex-col items-center text-center" style={{ gap: "20px" }}>
              <div className="flex items-center justify-center rounded-full" style={{ width: "56px", height: "56px", background: "#f0f9f2" }}>
                <CheckCircle2 size={28} color="#074616" />
              </div>
              <div className="flex flex-col" style={{ gap: "6px" }}>
                <h2 className="font-bold text-[24px]" style={{ color: "#1a1a2e" }}>Password reset</h2>
                <p className="text-[13px] leading-relaxed" style={{ color: "#9ca3af" }}>
                  Your password has been updated. Redirecting you to sign in…
                </p>
              </div>
              <Link
                href="/"
                className="w-full flex items-center justify-center gap-2 rounded-lg font-bold text-[14px] text-white transition-opacity hover:opacity-90"
                style={{ padding: "13px", background: "#33084E" }}
              >
                Go to sign in
              </Link>
            </div>
          ) : !linkValid ? (
            <div className="flex flex-col" style={{ gap: "20px" }}>
              <div className="flex flex-col" style={{ gap: "6px" }}>
                <h2 className="font-bold text-[28px]" style={{ color: "#1a1a2e" }}>Invalid link</h2>
                <p className="text-[13px] leading-relaxed" style={{ color: "#9ca3af" }}>
                  This password reset link is missing information or is malformed. Please request a new one.
                </p>
              </div>
              <Link
                href="/forgot-password"
                className="w-full flex items-center justify-center gap-2 rounded-lg font-bold text-[14px] text-white transition-opacity hover:opacity-90"
                style={{ padding: "13px", background: "#33084E" }}
              >
                Request a new link
              </Link>
            </div>
          ) : (
            <>
              <div className="flex flex-col" style={{ gap: "6px" }}>
                <h2 className="font-bold text-[28px]" style={{ color: "#1a1a2e" }}>Set new password</h2>
                <p className="text-[13px]" style={{ color: "#9ca3af" }}>
                  Resetting the password for <span style={{ color: "#1a1a2e", fontWeight: 600 }}>{email}</span>.
                </p>
              </div>

              <form onSubmit={handleSubmit} noValidate className="flex flex-col" style={{ gap: "28px" }}>

                {/* General error */}
                {errors.general && (
                  <div className="rounded-lg text-[13px] font-medium" style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
                    {errors.general}
                  </div>
                )}

                {/* New password */}
                <div className="flex flex-col" style={{ gap: "6px" }}>
                  <div className="relative">
                    <input
                      type={showPw ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="New password"
                      value={password}
                      onChange={e => { setPassword(e.target.value); setErrors(p => ({ ...p, password: undefined, general: undefined })); }}
                      className="w-full bg-transparent text-[14px] outline-none pb-2 pr-8"
                      style={{
                        borderBottom: `1.5px solid ${errors.password ? "#dc2626" : "#e5e7eb"}`,
                        color: "#1a1a2e",
                        transition: "border-color 0.15s",
                      }}
                      onFocus={e => { if (!errors.password) e.currentTarget.style.borderBottomColor = "#33084E"; }}
                      onBlur={e => { if (!errors.password) e.currentTarget.style.borderBottomColor = "#e5e7eb"; }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw(v => !v)}
                      className="absolute right-0 bottom-2 transition-colors"
                      style={{ color: "#9ca3af" }}
                      tabIndex={-1}
                    >
                      {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {/* Strength meter */}
                  {password && (
                    <div className="flex flex-col" style={{ gap: "5px", marginTop: "4px" }}>
                      <div className="flex gap-1.5">
                        {[1, 2, 3, 4].map(seg => (
                          <div
                            key={seg}
                            className="flex-1 rounded-full"
                            style={{
                              height: "3px",
                              background: seg <= strength ? STRENGTH[strength].color : "#e5e7eb",
                              transition: "background 0.2s",
                            }}
                          />
                        ))}
                      </div>
                      {strength > 0 && (
                        <span className="text-[11px] font-medium" style={{ color: STRENGTH[strength].color }}>
                          {STRENGTH[strength].label} password
                        </span>
                      )}
                    </div>
                  )}

                  {errors.password && <span className="text-[12px]" style={{ color: "#dc2626" }}>{errors.password}</span>}
                </div>

                {/* Confirm password */}
                <div className="flex flex-col" style={{ gap: "6px" }}>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="Confirm new password"
                      value={confirm}
                      onChange={e => { setConfirm(e.target.value); setErrors(p => ({ ...p, confirm: undefined, general: undefined })); }}
                      className="w-full bg-transparent text-[14px] outline-none pb-2 pr-8"
                      style={{
                        borderBottom: `1.5px solid ${errors.confirm ? "#dc2626" : "#e5e7eb"}`,
                        color: "#1a1a2e",
                        transition: "border-color 0.15s",
                      }}
                      onFocus={e => { if (!errors.confirm) e.currentTarget.style.borderBottomColor = "#33084E"; }}
                      onBlur={e => { if (!errors.confirm) e.currentTarget.style.borderBottomColor = "#e5e7eb"; }}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-0 bottom-2 transition-colors"
                      style={{ color: "#9ca3af" }}
                      tabIndex={-1}
                    >
                      {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {errors.confirm && <span className="text-[12px]" style={{ color: "#dc2626" }}>{errors.confirm}</span>}
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-2 rounded-lg font-bold text-[14px] text-white transition-opacity"
                  style={{
                    padding: "13px",
                    background: "#33084E",
                    opacity: loading ? 0.7 : 1,
                    cursor: loading ? "not-allowed" : "pointer",
                    marginTop: "4px",
                  }}
                >
                  {loading ? (
                    <>
                      <Loader2 size={15} className="animate-spin" />
                      Resetting…
                    </>
                  ) : (
                    "Reset password"
                  )}
                </button>

                <Link
                  href="/"
                  className="text-center text-[13px] font-medium transition-colors hover:opacity-70"
                  style={{ color: "#33084E" }}
                >
                  Back to sign in
                </Link>
              </form>
            </>
          )}
        </div>

        {/* Bottom */}
        <p className="text-center text-[12px]" style={{ color: "#d1d5db" }}>
          &copy; {new Date().getFullYear()} FastLink SaaS. All rights reserved.
        </p>
      </div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen flex items-center justify-center bg-white">
          <Loader2 size={22} className="animate-spin" style={{ color: "#33084E" }} />
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  );
}
