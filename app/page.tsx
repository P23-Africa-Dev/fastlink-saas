"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Eye, EyeOff, Loader2, Zap } from "lucide-react";
import api from "@/lib/api";
import { useAuthStore } from "@/lib/stores/authStore";
import type { ApiResponse, LoginResponseData } from "@/lib/types";

interface FormErrors {
  email?: string;
  password?: string;
  general?: string;
}

function validate(email: string, password: string): FormErrors {
  const errors: FormErrors = {};
  if (!email.trim()) {
    errors.email = "Email is required.";
  } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = "Enter a valid email address.";
  }
  if (!password) {
    errors.password = "Password is required.";
  } else if (password.length < 6) {
    errors.password = "Password must be at least 6 characters.";
  }
  return errors;
}

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((s) => s.setAuth);

  const [email, setEmail]       = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw]     = useState(false);
  const [errors, setErrors]     = useState<FormErrors>({});
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const errs = validate(email, password);
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    setLoading(true);
    try {
      const res = await api.post<ApiResponse<LoginResponseData>>("/auth/login", {
        email,
        password,
        device_name: "frontend-web",
      });
      const { token, user } = res.data.data;
      setAuth(token, user);
      router.push("/dashboard");
    } catch (err: unknown) {
      const status = (err as { response?: { status?: number } }).response?.status;
      if (status === 401 || status === 422) {
        setErrors({ general: "Invalid email or password. Please try again." });
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
            <Zap size={22} color="white" fill="white" />
          </div>
          <span className="text-white font-bold text-xl tracking-tight">FastLink</span>
        </div>

        {/* Hero */}
        <div className="relative flex flex-col" style={{ gap: "20px" }}>
          <h1 className="text-white font-bold leading-tight" style={{ fontSize: "clamp(2.2rem, 3.8vw, 3.2rem)" }}>
            Hello<br />FastLink!
          </h1>
          <p className="text-white/60 text-[15px] leading-relaxed max-w-xs">
            Manage your leads, projects, attendance, and team — all from one unified dashboard.
          </p>
        </div>

        {/* Footer */}
        <p className="relative text-white/30 text-[12px]">
          &copy; {new Date().getFullYear()} FastLink SaaS. All rights reserved.
        </p>
      </div>

      {/* Right panel */}
      <div className="flex flex-1 flex-col justify-between bg-white p-10 lg:p-16">

        {/* Top — app name */}
        <div className="flex items-center gap-2 lg:hidden">
          <div className="flex items-center justify-center rounded-xl" style={{ width: "32px", height: "32px", background: "#33084E" }}>
            <Zap size={15} color="white" fill="white" />
          </div>
          <span className="font-bold text-[15px]" style={{ color: "#33084E" }}>FastLink</span>
        </div>
        <div className="hidden lg:block">
          {/* <span className="font-bold text-[15px]" style={{ color: "#33084E" }}>FastLink</span> */}
        </div>

        {/* Form area */}
        <div className="w-full max-w-sm mx-auto flex flex-col" style={{ gap: "36px" }}>

          <div className="flex flex-col" style={{ gap: "6px" }}>
            <h2 className="font-bold text-[28px]" style={{ color: "#1a1a2e" }}>Welcome Back!</h2>
            <p className="text-[13px]" style={{ color: "#9ca3af" }}>
              Sign in to your admin account to continue.
            </p>
          </div>

          <form onSubmit={handleSubmit} noValidate className="flex flex-col" style={{ gap: "28px" }}>

            {/* General error */}
            {errors.general && (
              <div className="rounded-lg text-[13px] font-medium" style={{ padding: "10px 14px", background: "#fef2f2", border: "1px solid #fecaca", color: "#dc2626" }}>
                {errors.general}
              </div>
            )}

            {/* Email */}
            <div className="flex flex-col" style={{ gap: "6px" }}>
              <input
                type="email"
                autoComplete="email"
                placeholder="Email address"
                value={email}
                onChange={e => { setEmail(e.target.value); setErrors(p => ({ ...p, email: undefined, general: undefined })); }}
                className="w-full bg-transparent text-[14px] outline-none pb-2"
                style={{
                  borderBottom: `1.5px solid ${errors.email ? "#dc2626" : "#e5e7eb"}`,
                  color: "#1a1a2e",
                  transition: "border-color 0.15s",
                }}
                onFocus={e => { if (!errors.email) e.currentTarget.style.borderBottomColor = "#33084E"; }}
                onBlur={e => { if (!errors.email) e.currentTarget.style.borderBottomColor = "#e5e7eb"; }}
              />
              {errors.email && <span className="text-[12px]" style={{ color: "#dc2626" }}>{errors.email}</span>}
            </div>

            {/* Password */}
            <div className="flex flex-col" style={{ gap: "6px" }}>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  autoComplete="current-password"
                  placeholder="Password"
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
              {errors.password && <span className="text-[12px]" style={{ color: "#dc2626" }}>{errors.password}</span>}
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
                  Signing in…
                </>
              ) : (
                "Sign In"
              )}
            </button>
          </form>
        </div>

        {/* Bottom */}
        <p className="text-center text-[12px]" style={{ color: "#d1d5db" }}>
          &copy; {new Date().getFullYear()} FastLink SaaS. All rights reserved.
        </p>
      </div>
    </div>
  );
}
