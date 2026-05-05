"use client";

import { useState, useEffect, useRef } from "react";
import {
  User,
  Palette,
  Building2,
  KeyRound,
  Sun,
  Moon,
  Monitor,
  Save,
  Eye,
  EyeOff,
  Clock,
  Globe,
  Plus,
  Trash2,
  Copy,
  Check,
  AlertTriangle,
  Shield,
  ChevronDown,
  X,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { useAuthStore } from "@/lib/stores/authStore";
import {
  useProfile,
  useUpdateProfile,
  useUpdateAppearance,
  useCompanySettings,
  useUpdateCompanySettings,
  usePasscodes,
  useGeneratePasscode,
  useRevokePasscode,
  useSupervisors,
  verifyPasscode,
  validateDeviceToken,
  type CompanySettings,
  type Passcode,
} from "./hooks/useSettings";

// ─── Constants ────────────────────────────────────────────────────────────────

const DAYS = ["monday", "tuesday", "wednesday", "thursday", "friday", "saturday", "sunday"] as const;
const DAY_SHORT: Record<string, string> = {
  monday: "Mon", tuesday: "Tue", wednesday: "Wed", thursday: "Thu",
  friday: "Fri", saturday: "Sat", sunday: "Sun",
};

const TIMEZONES = [
  "UTC", "Africa/Lagos", "Africa/Nairobi", "Africa/Accra", "Africa/Cairo",
  "America/New_York", "America/Chicago", "America/Denver", "America/Los_Angeles",
  "Europe/London", "Europe/Paris", "Europe/Berlin", "Asia/Dubai", "Asia/Kolkata",
  "Asia/Singapore", "Asia/Tokyo", "Australia/Sydney",
];

type Tab = "profile" | "appearance" | "company" | "passcodes";

// ─── Shared Input ─────────────────────────────────────────────────────────────

function Field({
  label, error, children,
}: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-col" style={{ gap: "6px" }}>
      <label className="text-[12px] font-bold text-(--text-primary) uppercase tracking-wider">{label}</label>
      {children}
      {error && <span className="text-[11px] text-red-500">{error}</span>}
    </div>
  );
}

function Input({
  value, onChange, placeholder, type = "text", maxLength, disabled,
}: {
  value: string; onChange: (v: string) => void; placeholder?: string;
  type?: string; maxLength?: number; disabled?: boolean;
}) {
  return (
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      maxLength={maxLength}
      disabled={disabled}
      className="w-full rounded-xl border border-[#f0f0f5] bg-white text-[13px] text-(--text-primary) placeholder:text-[#9ca3af] outline-none transition-all focus:border-[#33084E] disabled:opacity-50 disabled:cursor-not-allowed"
      style={{ padding: "10px 14px" }}
    />
  );
}

function SaveBtn({ loading, onClick, label = "Save Changes" }: { loading?: boolean; onClick?: () => void; label?: string }) {
  return (
    <button
      onClick={onClick}
      disabled={loading}
      className="inline-flex items-center rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90 disabled:opacity-60 disabled:cursor-not-allowed"
      style={{ padding: "10px 20px", gap: "7px", background: "#33084E" }}
    >
      {loading ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
      {label}
    </button>
  );
}

// ─── Profile Tab ──────────────────────────────────────────────────────────────

function ProfileTab() {
  const { data: profile, isLoading } = useProfile();
  const updateMutation = useUpdateProfile();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [currentPassword, setCurrentPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setEmail(profile.email);
    }
  }, [profile]);

  const handleSave = () => {
    setErrors({});
    const payload: Parameters<typeof updateMutation.mutate>[0] = {};
    if (name !== profile?.name) payload.name = name;
    if (email !== profile?.email) payload.email = email;
    if (newPassword) {
      payload.current_password = currentPassword;
      payload.password = newPassword;
      payload.password_confirmation = confirmPassword;
    }
    if (!Object.keys(payload).length) return;

    updateMutation.mutate(payload, {
      onSuccess: () => {
        toast.success("Profile updated successfully");
        setNewPassword(""); setCurrentPassword(""); setConfirmPassword("");
      },
      onError: (err: unknown) => {
        const e = (err as { response?: { data?: { errors?: Record<string, string[]> } } }).response?.data?.errors ?? {};
        const flat: Record<string, string> = {};
        Object.entries(e).forEach(([k, v]) => { flat[k] = v[0]; });
        setErrors(flat);
        toast.error("Failed to update profile");
      },
    });
  };

  if (isLoading) {
    return (
      <div className="flex flex-col" style={{ gap: "20px" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-16 rounded-2xl bg-[#f8f8fc] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col" style={{ gap: "28px" }}>
      {/* Identity */}
      <div className="rounded-2xl border border-[#f0f0f5] bg-white" style={{ padding: "24px", gap: "20px", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center" style={{ gap: "10px" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#f3e8ff" }}>
            <User size={15} style={{ color: "#33084E" }} />
          </div>
          <div>
            <p className="text-[14px] font-bold text-(--text-primary)">Personal Information</p>
            <p className="text-[12px] text-[#9ca3af]">Update your name and email address</p>
          </div>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          <Field label="Full Name" error={errors.name}>
            <div className="relative">
              <Input value={name} onChange={setName} placeholder="Alice Johnson" maxLength={255} />
              <span className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] text-[#9ca3af]">{name.length}/255</span>
            </div>
          </Field>
          <Field label="Email Address" error={errors.email}>
            <Input value={email} onChange={setEmail} placeholder="alice@company.com" type="email" />
          </Field>
        </div>

        {/* Role badge */}
        {profile?.roles?.[0] && (
          <div className="flex items-center" style={{ gap: "8px" }}>
            <span className="text-[11px] text-[#9ca3af] font-medium">Your role:</span>
            <span className="inline-flex rounded-lg text-[11px] font-bold capitalize" style={{ padding: "3px 10px", background: "#f3e8ff", color: "#33084E" }}>
              {profile.roles[0].name}
            </span>
          </div>
        )}
      </div>

      {/* Password */}
      <div className="rounded-2xl border border-[#f0f0f5] bg-white" style={{ padding: "24px", gap: "20px", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center" style={{ gap: "10px" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#fef3c7" }}>
            <KeyRound size={15} style={{ color: "#AF580B" }} />
          </div>
          <div>
            <p className="text-[14px] font-bold text-(--text-primary)">Change Password</p>
            <p className="text-[12px] text-[#9ca3af]">Leave blank to keep your current password</p>
          </div>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(260px, 1fr))" }}>
          <Field label="New Password" error={errors.password}>
            <div className="relative">
              <Input value={newPassword} onChange={setNewPassword} placeholder="Min 8 characters" type={showNew ? "text" : "password"} />
              <button type="button" onClick={() => setShowNew((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-(--text-primary) transition-colors">
                {showNew ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Field>
          <Field label="Confirm Password" error={errors.password_confirmation}>
            <div className="relative">
              <Input value={confirmPassword} onChange={setConfirmPassword} placeholder="Repeat new password" type={showConfirm ? "text" : "password"} />
              <button type="button" onClick={() => setShowConfirm((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-(--text-primary) transition-colors">
                {showConfirm ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
            </div>
          </Field>
          {newPassword && (
            <Field label="Current Password" error={errors.current_password}>
              <div className="relative">
                <Input value={currentPassword} onChange={setCurrentPassword} placeholder="Verify your identity" type={showCurrent ? "text" : "password"} />
                <button type="button" onClick={() => setShowCurrent((v) => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#9ca3af] hover:text-(--text-primary) transition-colors">
                  {showCurrent ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </Field>
          )}
        </div>
      </div>

      <div className="flex justify-end">
        <SaveBtn loading={updateMutation.isPending} onClick={handleSave} />
      </div>
    </div>
  );
}

// ─── Appearance Tab ───────────────────────────────────────────────────────────

function AppearanceTab() {
  const { data: profile, isLoading } = useProfile();
  const updateAppearance = useUpdateAppearance();
  const [current, setCurrent] = useState<"light" | "dark" | "system">("system");

  useEffect(() => {
    if (profile?.appearance) setCurrent(profile.appearance as "light" | "dark" | "system");
  }, [profile?.appearance]);

  const handleChange = (val: "light" | "dark" | "system") => {
    setCurrent(val);
    localStorage.setItem("fastlink_appearance", val);
    updateAppearance.mutate(val, {
      onSuccess: () => toast.success("Appearance preference saved"),
      onError: () => toast.error("Failed to save appearance"),
    });
  };

  const options: { value: "light" | "dark" | "system"; label: string; desc: string; icon: React.ReactNode; preview: React.ReactNode }[] = [
    {
      value: "light",
      label: "Light",
      desc: "Clean white interface",
      icon: <Sun size={22} />,
      preview: (
        <div className="w-full rounded-xl overflow-hidden border border-[#e5e7eb]" style={{ height: "80px", background: "#ffffff" }}>
          <div className="h-4 border-b border-[#f0f0f5]" style={{ background: "#f8f8fc" }} />
          <div style={{ padding: "8px", gap: "4px", display: "flex", flexDirection: "column" }}>
            <div className="h-2 rounded-full w-3/4" style={{ background: "#e5e7eb" }} />
            <div className="h-2 rounded-full w-1/2" style={{ background: "#f0f0f5" }} />
          </div>
        </div>
      ),
    },
    {
      value: "dark",
      label: "Dark",
      desc: "Easy on the eyes at night",
      icon: <Moon size={22} />,
      preview: (
        <div className="w-full rounded-xl overflow-hidden border border-[#374151]" style={{ height: "80px", background: "#111827" }}>
          <div className="h-4 border-b border-[#1f2937]" style={{ background: "#1a2332" }} />
          <div style={{ padding: "8px", gap: "4px", display: "flex", flexDirection: "column" }}>
            <div className="h-2 rounded-full w-3/4" style={{ background: "#374151" }} />
            <div className="h-2 rounded-full w-1/2" style={{ background: "#1f2937" }} />
          </div>
        </div>
      ),
    },
    {
      value: "system",
      label: "System",
      desc: "Follows your OS preference",
      icon: <Monitor size={22} />,
      preview: (
        <div className="w-full rounded-xl overflow-hidden border border-[#e5e7eb]" style={{ height: "80px", background: "linear-gradient(135deg, #ffffff 50%, #111827 50%)" }}>
          <div className="h-4 border-b" style={{ background: "linear-gradient(135deg, #f8f8fc 50%, #1a2332 50%)", borderColor: "#e5e7eb" }} />
          <div style={{ padding: "8px", gap: "4px", display: "flex", flexDirection: "column" }}>
            <div className="h-2 rounded-full w-3/4" style={{ background: "linear-gradient(135deg, #e5e7eb 50%, #374151 50%)" }} />
            <div className="h-2 rounded-full w-1/2" style={{ background: "linear-gradient(135deg, #f0f0f5 50%, #1f2937 50%)" }} />
          </div>
        </div>
      ),
    },
  ];

  if (isLoading) return <div className="h-48 rounded-2xl bg-[#f8f8fc] animate-pulse" />;

  return (
    <div className="flex flex-col" style={{ gap: "28px" }}>
      <div className="rounded-2xl border border-[#f0f0f5] bg-white" style={{ padding: "24px", gap: "20px", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center" style={{ gap: "10px" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#f0fdf4" }}>
            <Palette size={15} style={{ color: "#074616" }} />
          </div>
          <div>
            <p className="text-[14px] font-bold text-(--text-primary)">Colour Scheme</p>
            <p className="text-[12px] text-[#9ca3af]">Choose how FastLink looks for you — saved across devices</p>
          </div>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
          {options.map((opt) => {
            const active = current === opt.value;
            return (
              <button
                key={opt.value}
                onClick={() => handleChange(opt.value)}
                className="flex flex-col rounded-2xl border-2 transition-all text-left hover:-translate-y-1"
                style={{
                  padding: "16px",
                  gap: "12px",
                  borderColor: active ? "#33084E" : "#f0f0f5",
                  background: active ? "#faf5ff" : "white",
                  boxShadow: active ? "0 0 0 3px rgba(51,8,78,0.08)" : "none",
                }}
              >
                {opt.preview}
                <div className="flex items-center justify-between">
                  <div className="flex items-center" style={{ gap: "8px" }}>
                    <span style={{ color: active ? "#33084E" : "#9ca3af" }}>{opt.icon}</span>
                    <div>
                      <p className="text-[13px] font-bold text-(--text-primary)">{opt.label}</p>
                      <p className="text-[11px] text-[#9ca3af]">{opt.desc}</p>
                    </div>
                  </div>
                  <div
                    className="w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-all"
                    style={{ borderColor: active ? "#33084E" : "#d1d5db", background: active ? "#33084E" : "white" }}
                  >
                    {active && <Check size={10} className="text-white" />}
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {updateAppearance.isPending && (
          <div className="flex items-center text-[12px] text-[#9ca3af]" style={{ gap: "6px" }}>
            <Loader2 size={12} className="animate-spin" /> Saving preference…
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Working Days Picker ──────────────────────────────────────────────────────

function WorkingDaysPicker({ value, onChange }: { value: string[]; onChange: (v: string[]) => void }) {
  return (
    <div className="flex flex-wrap" style={{ gap: "8px" }}>
      {DAYS.map((day) => {
        const active = value.includes(day);
        return (
          <button
            key={day}
            type="button"
            onClick={() => onChange(active ? value.filter((d) => d !== day) : [...value, day])}
            className="rounded-xl text-[12px] font-bold transition-all"
            style={{
              padding: "7px 14px",
              background: active ? "#33084E" : "#f8f8fc",
              color: active ? "white" : "#6b7280",
              border: `1.5px solid ${active ? "#33084E" : "#e5e7eb"}`,
            }}
          >
            {DAY_SHORT[day]}
          </button>
        );
      })}
    </div>
  );
}

// ─── Timezone Select ──────────────────────────────────────────────────────────

function TimezoneSelect({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = TIMEZONES.filter((tz) => tz.toLowerCase().includes(search.toLowerCase()));

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="w-full flex items-center justify-between rounded-xl border border-[#f0f0f5] bg-white text-[13px] text-(--text-primary) transition-all focus:border-[#33084E]"
        style={{ padding: "10px 14px" }}
      >
        <span className="flex items-center" style={{ gap: "7px" }}>
          <Globe size={13} className="text-[#9ca3af]" />
          {value || "Select timezone"}
        </span>
        <ChevronDown size={13} className="text-[#9ca3af]" />
      </button>
      {open && (
        <div className="absolute z-50 w-full rounded-2xl border border-[#f0f0f5] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.15)] overflow-hidden" style={{ top: "calc(100% + 6px)" }}>
          <div style={{ padding: "8px" }}>
            <input
              autoFocus
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search timezone…"
              className="w-full rounded-xl border border-[#f0f0f5] text-[12px] outline-none"
              style={{ padding: "7px 12px" }}
            />
          </div>
          <div className="overflow-y-auto" style={{ maxHeight: "200px" }}>
            {filtered.map((tz) => (
              <button
                key={tz}
                type="button"
                onClick={() => { onChange(tz); setOpen(false); setSearch(""); }}
                className="w-full text-left text-[12px] text-(--text-primary) hover:bg-[#f8f8fc] transition-colors"
                style={{ padding: "8px 14px", fontWeight: value === tz ? 700 : 400 }}
              >
                {value === tz && <Check size={11} className="inline mr-2" style={{ color: "#33084E" }} />}
                {tz}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Company Settings Form ────────────────────────────────────────────────────

function CompanyForm({
  initial,
  onSave,
  saving,
  readOnly,
}: {
  initial: CompanySettings;
  onSave?: (data: Partial<CompanySettings>) => void;
  saving?: boolean;
  readOnly?: boolean;
}) {
  const [companyName, setCompanyName] = useState(initial.company_name ?? "");
  const [openingTime, setOpeningTime] = useState(initial.opening_time?.slice(0, 5) ?? "");
  const [closingTime, setClosingTime] = useState(initial.closing_time?.slice(0, 5) ?? "");
  const [workingDays, setWorkingDays] = useState<string[]>(initial.working_days ?? []);
  const [timezone, setTimezone] = useState(initial.timezone ?? "UTC");
  const [timeError, setTimeError] = useState("");

  const handleSave = () => {
    setTimeError("");
    if (openingTime && closingTime && openingTime >= closingTime) {
      setTimeError("Closing time must be after opening time");
      return;
    }
    onSave?.({ company_name: companyName, opening_time: openingTime, closing_time: closingTime, working_days: workingDays, timezone });
  };

  return (
    <div className="flex flex-col" style={{ gap: "20px" }}>
      <Field label="Company Name">
        <Input value={companyName} onChange={setCompanyName} placeholder="FastLink Corp" maxLength={255} disabled={readOnly} />
      </Field>

      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))" }}>
        <Field label="Opening Time" error={timeError}>
          <div className="relative">
            <Clock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="time"
              value={openingTime}
              onChange={(e) => setOpeningTime(e.target.value)}
              disabled={readOnly}
              className="w-full rounded-xl border border-[#f0f0f5] bg-white text-[13px] text-(--text-primary) outline-none focus:border-[#33084E] transition-all disabled:opacity-50"
              style={{ padding: "10px 14px 10px 34px" }}
            />
          </div>
        </Field>
        <Field label="Closing Time">
          <div className="relative">
            <Clock size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-[#9ca3af]" />
            <input
              type="time"
              value={closingTime}
              onChange={(e) => setClosingTime(e.target.value)}
              disabled={readOnly}
              className="w-full rounded-xl border border-[#f0f0f5] bg-white text-[13px] text-(--text-primary) outline-none focus:border-[#33084E] transition-all disabled:opacity-50"
              style={{ padding: "10px 14px 10px 34px" }}
            />
          </div>
        </Field>
      </div>

      <Field label="Working Days">
        <WorkingDaysPicker value={workingDays} onChange={readOnly ? () => {} : setWorkingDays} />
      </Field>

      <Field label="Timezone">
        {readOnly ? (
          <div className="flex items-center rounded-xl border border-[#f0f0f5] bg-[#f8f8fc] text-[13px] text-[#6b7280]" style={{ padding: "10px 14px", gap: "7px" }}>
            <Globe size={13} className="text-[#9ca3af]" />
            {timezone}
          </div>
        ) : (
          <TimezoneSelect value={timezone} onChange={setTimezone} />
        )}
      </Field>

      {!readOnly && (
        <div className="flex justify-end">
          <SaveBtn loading={saving} onClick={handleSave} />
        </div>
      )}
    </div>
  );
}

// ─── Supervisor Passcode Gate ─────────────────────────────────────────────────

type SupervisorScreen = "checking" | "passcode" | "settings";

function SupervisorCompanySettings({ company }: { company: CompanySettings }) {
  const [screen, setScreen] = useState<SupervisorScreen>("checking");
  const [sessionToken, setSessionToken] = useState<string | null>(null);
  const [passcodeInput, setPasscodeInput] = useState("");
  const [rememberDevice, setRememberDevice] = useState(false);
  const [passcodeError, setPasscodeError] = useState("");
  const [verifying, setVerifying] = useState(false);

  const updateMutation = useUpdateCompanySettings();

  useEffect(() => {
    const deviceToken = localStorage.getItem("fastlink_company_device_token");
    if (!deviceToken) { setScreen("passcode"); return; }
    validateDeviceToken(deviceToken)
      .then(() => setScreen("settings"))
      .catch(() => {
        localStorage.removeItem("fastlink_company_device_token");
        setScreen("passcode");
      });
  }, []);

  const handlePasscodeSubmit = async () => {
    setPasscodeError("");
    setVerifying(true);
    try {
      const res = await verifyPasscode(passcodeInput, rememberDevice);
      setSessionToken(res.session_token);
      if (rememberDevice && res.device_token) {
        localStorage.setItem("fastlink_company_device_token", res.device_token);
      }
      setScreen("settings");
    } catch {
      setPasscodeError("Incorrect passcode. Please try again.");
    } finally {
      setVerifying(false);
    }
  };

  const handleSave = (data: Partial<CompanySettings>) => {
    const deviceToken = localStorage.getItem("fastlink_company_device_token");
    let supervisorToken: { type: "session" | "device"; value: string } | undefined;
    if (sessionToken) supervisorToken = { type: "session", value: sessionToken };
    else if (deviceToken) supervisorToken = { type: "device", value: deviceToken };

    updateMutation.mutate(
      { payload: data, supervisorToken },
      {
        onSuccess: () => toast.success("Company settings updated"),
        onError: (err: unknown) => {
          const status = (err as { response?: { status?: number } }).response?.status;
          if (status === 403) {
            localStorage.removeItem("fastlink_company_device_token");
            setSessionToken(null);
            setScreen("passcode");
            toast.error("Session expired. Please re-enter your passcode.");
          } else {
            toast.error("Failed to update company settings");
          }
        },
      }
    );
  };

  if (screen === "checking") {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 size={24} className="animate-spin text-[#33084E]" />
      </div>
    );
  }

  if (screen === "passcode") {
    return (
      <div className="flex flex-col items-center justify-center" style={{ padding: "48px 24px", gap: "24px" }}>
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center" style={{ background: "#f3e8ff" }}>
          <Shield size={28} style={{ color: "#33084E" }} />
        </div>
        <div className="text-center" style={{ gap: "6px", display: "flex", flexDirection: "column" }}>
          <p className="text-[18px] font-bold text-(--text-primary)">Supervisor Access Required</p>
          <p className="text-[13px] text-[#9ca3af] max-w-xs">Enter the passcode provided by your admin to edit company settings.</p>
        </div>

        <div className="w-full max-w-sm flex flex-col" style={{ gap: "14px" }}>
          <div className="relative">
            <input
              type="text"
              value={passcodeInput}
              onChange={(e) => setPasscodeInput(e.target.value.toUpperCase())}
              placeholder="ABCD-EFGH"
              className="w-full rounded-xl border text-[15px] font-mono font-bold text-center text-(--text-primary) outline-none transition-all tracking-widest"
              style={{
                padding: "14px",
                borderColor: passcodeError ? "#ef4444" : "#f0f0f5",
                letterSpacing: "0.2em",
              }}
              onKeyDown={(e) => e.key === "Enter" && handlePasscodeSubmit()}
            />
          </div>

          {passcodeError && (
            <div className="flex items-center rounded-xl text-[12px] text-red-600" style={{ gap: "6px", padding: "8px 12px", background: "#fee2e2" }}>
              <AlertTriangle size={13} /> {passcodeError}
            </div>
          )}

          <label className="flex items-center cursor-pointer" style={{ gap: "8px" }}>
            <input
              type="checkbox"
              checked={rememberDevice}
              onChange={(e) => setRememberDevice(e.target.checked)}
              className="rounded"
              style={{ accentColor: "#33084E" }}
            />
            <span className="text-[12px] text-(--text-primary)">Remember this device</span>
          </label>

          <button
            onClick={handlePasscodeSubmit}
            disabled={!passcodeInput || verifying}
            className="w-full rounded-xl text-[14px] font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center"
            style={{ padding: "12px", gap: "8px", background: "#33084E" }}
          >
            {verifying ? <Loader2 size={15} className="animate-spin" /> : <KeyRound size={15} />}
            Verify Passcode
          </button>
        </div>
      </div>
    );
  }

  return (
    <CompanyForm
      initial={company}
      onSave={handleSave}
      saving={updateMutation.isPending}
    />
  );
}

// ─── Company Tab ──────────────────────────────────────────────────────────────

function CompanyTab({ role }: { role: string }) {
  const { data: company, isLoading } = useCompanySettings();
  const updateMutation = useUpdateCompanySettings();

  if (isLoading || !company) {
    return <div className="h-64 rounded-2xl bg-[#f8f8fc] animate-pulse" />;
  }

  const sectionHeader = (
    <div className="flex items-center" style={{ gap: "10px", marginBottom: "20px" }}>
      <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#fef3c7" }}>
        <Building2 size={15} style={{ color: "#AF580B" }} />
      </div>
      <div>
        <p className="text-[14px] font-bold text-(--text-primary)">Organisation Settings</p>
        <p className="text-[12px] text-[#9ca3af]">Configure working hours, days, and timezone</p>
      </div>
    </div>
  );

  if (role === "admin") {
    return (
      <div className="rounded-2xl border border-[#f0f0f5] bg-white" style={{ padding: "24px" }}>
        {sectionHeader}
        <CompanyForm
          initial={company}
          onSave={(data) =>
            updateMutation.mutate(
              { payload: data },
              {
                onSuccess: () => toast.success("Company settings updated"),
                onError: () => toast.error("Failed to update company settings"),
              }
            )
          }
          saving={updateMutation.isPending}
        />
      </div>
    );
  }

  if (role === "supervisor") {
    return (
      <div className="rounded-2xl border border-[#f0f0f5] bg-white" style={{ padding: "24px" }}>
        {sectionHeader}
        <SupervisorCompanySettings company={company} />
      </div>
    );
  }

  // Staff — read only
  return (
    <div className="rounded-2xl border border-[#f0f0f5] bg-white" style={{ padding: "24px" }}>
      {sectionHeader}
      <div className="flex items-center rounded-xl text-[12px] text-[#9ca3af] mb-5" style={{ gap: "6px", padding: "10px 14px", background: "#f8f8fc" }}>
        <AlertTriangle size={13} />
        You have read-only access to company settings.
      </div>
      <CompanyForm initial={company} readOnly />
    </div>
  );
}

// ─── Passcode Reveal Modal ────────────────────────────────────────────────────

function PasscodeRevealModal({ code, onDone }: { code: string; onDone: () => void }) {
  const [copied, setCopied] = useState(false);
  const [confirmed, setConfirmed] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center" style={{ background: "rgba(0,0,0,0.45)" }}>
      <div className="rounded-3xl bg-white shadow-[0_24px_80px_rgba(0,0,0,0.25)] w-full max-w-md mx-4 flex flex-col" style={{ padding: "32px", gap: "20px" }}>
        <div className="flex items-center justify-between">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center" style={{ background: "#f3e8ff" }}>
            <KeyRound size={18} style={{ color: "#33084E" }} />
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#9ca3af]">One-Time Display</span>
        </div>

        <div>
          <p className="text-[18px] font-bold text-(--text-primary)">Passcode Generated</p>
          <p className="text-[13px] text-[#9ca3af] mt-1">This code will never be shown again. Share it directly with the supervisor.</p>
        </div>

        <div className="rounded-2xl border-2 border-dashed flex items-center justify-between" style={{ padding: "16px 20px", borderColor: "#33084E", background: "#faf5ff" }}>
          <span className="font-mono text-[22px] font-bold tracking-widest" style={{ color: "#33084E", letterSpacing: "0.18em" }}>{code}</span>
          <button
            onClick={handleCopy}
            className="flex items-center rounded-xl text-[12px] font-bold transition-all"
            style={{ padding: "7px 12px", gap: "5px", background: copied ? "#dcfce7" : "#33084E", color: copied ? "#074616" : "white" }}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? "Copied!" : "Copy"}
          </button>
        </div>

        <div className="flex items-start rounded-xl text-[12px] text-[#AF580B]" style={{ gap: "8px", padding: "10px 14px", background: "#fef3c7" }}>
          <AlertTriangle size={14} className="shrink-0 mt-0.5" />
          <span>This passcode is stored as a hash only. Once you close this modal, it cannot be retrieved.</span>
        </div>

        <label className="flex items-center cursor-pointer" style={{ gap: "8px" }}>
          <input type="checkbox" checked={confirmed} onChange={(e) => setConfirmed(e.target.checked)} style={{ accentColor: "#33084E" }} />
          <span className="text-[13px] text-(--text-primary) font-medium">I have copied and shared the code with the supervisor.</span>
        </label>

        <button
          onClick={onDone}
          disabled={!confirmed}
          className="w-full rounded-xl text-[14px] font-bold text-white transition-all hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{ padding: "12px", background: "#33084E" }}
        >
          Done, dismiss
        </button>
      </div>
    </div>
  );
}

// ─── Passcodes Tab ────────────────────────────────────────────────────────────

function PasscodesTab() {
  const { data: passcodes, isLoading } = usePasscodes();
  const { data: supervisors } = useSupervisors();
  const generateMutation = useGeneratePasscode();
  const revokeMutation = useRevokePasscode();

  const [selectedSupervisor, setSelectedSupervisor] = useState<number | "">("");
  const [expiresAt, setExpiresAt] = useState("");
  const [revealCode, setRevealCode] = useState<string | null>(null);
  const [revokingId, setRevokingId] = useState<number | null>(null);
  const [supervisorDropOpen, setSupervisorDropOpen] = useState(false);
  const [supervisorSearch, setSupervisorSearch] = useState("");
  const dropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropRef.current && !dropRef.current.contains(e.target as Node)) setSupervisorDropOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const handleGenerate = () => {
    if (!selectedSupervisor) return;
    const payload: { supervisor_id: number; expires_at?: string } = { supervisor_id: selectedSupervisor as number };
    if (expiresAt) payload.expires_at = expiresAt;

    generateMutation.mutate(payload, {
      onSuccess: (data) => {
        setRevealCode(data.plain_text);
        setSelectedSupervisor("");
        setExpiresAt("");
        toast.success("Passcode generated");
      },
      onError: (err: unknown) => {
        const msg = (err as { response?: { data?: { message?: string } } }).response?.data?.message ?? "Failed to generate passcode";
        toast.error(msg);
      },
    });
  };

  const handleRevoke = (id: number) => {
    setRevokingId(id);
    revokeMutation.mutate(id, {
      onSuccess: () => { toast.success("Passcode revoked"); setRevokingId(null); },
      onError: () => { toast.error("Failed to revoke passcode"); setRevokingId(null); },
    });
  };

  const filteredSupervisors = (supervisors ?? []).filter((s) =>
    s.name.toLowerCase().includes(supervisorSearch.toLowerCase()) ||
    s.email.toLowerCase().includes(supervisorSearch.toLowerCase())
  );
  const selectedSupervisorData = (supervisors ?? []).find((s) => s.id === selectedSupervisor);

  return (
    <div className="flex flex-col" style={{ gap: "24px" }}>
      {/* Generate Passcode */}
      <div className="rounded-2xl border border-[#f0f0f5] bg-white" style={{ padding: "24px", gap: "20px", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center" style={{ gap: "10px" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#f3e8ff" }}>
            <Plus size={15} style={{ color: "#33084E" }} />
          </div>
          <div>
            <p className="text-[14px] font-bold text-(--text-primary)">Generate Passcode</p>
            <p className="text-[12px] text-[#9ca3af]">Create a one-time passcode for a supervisor to edit company settings</p>
          </div>
        </div>

        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fill, minmax(240px, 1fr))" }}>
          {/* Supervisor select */}
          <Field label="Supervisor">
            <div ref={dropRef} className="relative">
              <button
                type="button"
                onClick={() => setSupervisorDropOpen((v) => !v)}
                className="w-full flex items-center justify-between rounded-xl border border-[#f0f0f5] bg-white text-[13px] transition-all"
                style={{ padding: "10px 14px" }}
              >
                <span className={selectedSupervisorData ? "text-(--text-primary)" : "text-[#9ca3af]"}>
                  {selectedSupervisorData ? selectedSupervisorData.name : "Select supervisor…"}
                </span>
                <ChevronDown size={13} className="text-[#9ca3af]" />
              </button>
              {supervisorDropOpen && (
                <div className="absolute z-50 w-full rounded-2xl border border-[#f0f0f5] bg-white shadow-[0_12px_40px_rgba(0,0,0,0.15)] overflow-hidden" style={{ top: "calc(100% + 6px)" }}>
                  <div style={{ padding: "8px" }}>
                    <input
                      autoFocus
                      type="text"
                      value={supervisorSearch}
                      onChange={(e) => setSupervisorSearch(e.target.value)}
                      placeholder="Search supervisors…"
                      className="w-full rounded-xl border border-[#f0f0f5] text-[12px] outline-none"
                      style={{ padding: "7px 12px" }}
                    />
                  </div>
                  <div className="overflow-y-auto" style={{ maxHeight: "200px" }}>
                    {filteredSupervisors.length === 0 ? (
                      <p className="text-[12px] text-[#9ca3af] text-center py-4">No supervisors found</p>
                    ) : (
                      filteredSupervisors.map((s) => (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => { setSelectedSupervisor(s.id); setSupervisorDropOpen(false); setSupervisorSearch(""); }}
                          className="w-full text-left hover:bg-[#f8f8fc] transition-colors"
                          style={{ padding: "8px 14px" }}
                        >
                          <p className="text-[13px] font-medium text-(--text-primary)">{s.name}</p>
                          <p className="text-[11px] text-[#9ca3af]">{s.email}</p>
                        </button>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </Field>

          <Field label="Expires On (optional)">
            <input
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              min={new Date(Date.now() + 86400000).toISOString().split("T")[0]}
              className="w-full rounded-xl border border-[#f0f0f5] bg-white text-[13px] text-(--text-primary) outline-none focus:border-[#33084E] transition-all"
              style={{ padding: "10px 14px" }}
            />
          </Field>
        </div>

        <div className="flex justify-end">
          <button
            onClick={handleGenerate}
            disabled={!selectedSupervisor || generateMutation.isPending}
            className="inline-flex items-center rounded-xl text-[13px] font-bold text-white transition-all hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
            style={{ padding: "10px 20px", gap: "7px", background: "#33084E" }}
          >
            {generateMutation.isPending ? <Loader2 size={14} className="animate-spin" /> : <KeyRound size={14} />}
            Generate Passcode
          </button>
        </div>
      </div>

      {/* Passcode List */}
      <div className="rounded-2xl border border-[#f0f0f5] bg-white" style={{ padding: "24px", gap: "16px", display: "flex", flexDirection: "column" }}>
        <div className="flex items-center" style={{ gap: "10px" }}>
          <div className="w-8 h-8 rounded-xl flex items-center justify-center" style={{ background: "#dcfce7" }}>
            <Shield size={15} style={{ color: "#074616" }} />
          </div>
          <div>
            <p className="text-[14px] font-bold text-(--text-primary)">Active Passcodes</p>
            <p className="text-[12px] text-[#9ca3af]">Manage and revoke supervisor access passcodes</p>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col" style={{ gap: "8px" }}>
            {[1, 2, 3].map((i) => <div key={i} className="h-16 rounded-2xl bg-[#f8f8fc] animate-pulse" />)}
          </div>
        ) : !passcodes?.length ? (
          <div className="flex flex-col items-center justify-center py-10 text-center" style={{ gap: "10px" }}>
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: "#f3f4f6" }}>
              <KeyRound size={20} className="text-[#9ca3af]" />
            </div>
            <p className="text-[14px] font-bold text-(--text-primary)">No passcodes yet</p>
            <p className="text-[12px] text-[#9ca3af]">Generate a passcode above to grant a supervisor temporary access.</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-[#f0f0f5] overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#f8f8fc] border-b border-[#f0f0f5]">
                  {["Supervisor", "Generated By", "Expires", "Status", ""].map((h) => (
                    <th key={h} className="text-left text-[11px] font-bold text-[#9ca3af] uppercase tracking-wider" style={{ padding: "10px 16px" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {passcodes.map((p, i) => (
                  <tr key={p.id} className="border-b border-[#f0f0f5] last:border-0" style={{ background: i % 2 === 0 ? "white" : "#fdfcff" }}>
                    <td style={{ padding: "12px 16px" }}>
                      <p className="text-[13px] font-bold text-(--text-primary)">{p.supervisor?.name ?? "—"}</p>
                      <p className="text-[11px] text-[#9ca3af]">{p.supervisor?.email ?? ""}</p>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <p className="text-[12px] text-(--text-primary)">{p.generated_by_user?.name ?? "—"}</p>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span className="text-[12px] text-[#6b7280]">
                        {p.expires_at ? new Date(p.expires_at).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }) : "Never"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      <span
                        className="inline-flex items-center rounded-full text-[11px] font-bold"
                        style={{ padding: "3px 10px", gap: "4px", background: p.is_active ? "#dcfce7" : "#fee2e2", color: p.is_active ? "#074616" : "#991b1b" }}
                      >
                        <span className="rounded-full" style={{ width: "5px", height: "5px", background: p.is_active ? "#16a34a" : "#dc2626" }} />
                        {p.is_active ? "Active" : "Revoked"}
                      </span>
                    </td>
                    <td style={{ padding: "12px 16px" }}>
                      {p.is_active && (
                        <button
                          onClick={() => handleRevoke(p.id)}
                          disabled={revokingId === p.id}
                          className="inline-flex items-center rounded-xl border border-[#f0f0f5] text-[11px] font-bold text-red-400 hover:border-red-300 hover:bg-red-50 transition-all disabled:opacity-50"
                          style={{ padding: "5px 12px", gap: "4px" }}
                        >
                          {revokingId === p.id ? <Loader2 size={11} className="animate-spin" /> : <Trash2 size={11} />}
                          Revoke
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {revealCode && (
        <PasscodeRevealModal code={revealCode} onDone={() => setRevealCode(null)} />
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SettingsPage() {
  const currentUser = useAuthStore((s) => s.user);
  const role = currentUser?.roles?.[0]?.name ?? "staff";
  const isAdmin = role === "admin";

  const tabs: { id: Tab; label: string; icon: React.ReactNode }[] = [
    { id: "profile", label: "Profile", icon: <User size={15} /> },
    { id: "appearance", label: "Appearance", icon: <Palette size={15} /> },
    { id: "company", label: "Company", icon: <Building2 size={15} /> },
    ...(isAdmin ? [{ id: "passcodes" as Tab, label: "Passcodes", icon: <KeyRound size={15} /> }] : []),
  ];

  const [activeTab, setActiveTab] = useState<Tab>("profile");

  return (
    <div className="flex flex-col w-full bg-white overflow-hidden" style={{ height: "calc(100vh - 75px)", padding: "32px", gap: "24px" }}>

      {/* Header */}
      <div className="flex flex-wrap items-start justify-between shrink-0" style={{ gap: "12px" }}>
        <div className="flex flex-col" style={{ gap: "2px" }}>
          <h1 className="text-[22px] font-bold text-(--text-primary)">Settings</h1>
          <p className="text-[13px] text-[#9ca3af]">Manage your profile, appearance, and organisation configuration.</p>
        </div>
      </div>

      {/* Tab bar */}
      <div className="flex items-center shrink-0 border-b border-[#f0f0f5]" style={{ gap: "4px" }}>
        {tabs.map((tab) => {
          const active = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className="relative flex items-center text-[13px] font-bold transition-all pb-3"
              style={{
                padding: "0 16px 12px",
                gap: "6px",
                color: active ? "#33084E" : "#9ca3af",
              }}
            >
              {tab.icon}
              {tab.label}
              {active && (
                <span className="absolute bottom-0 left-0 right-0 h-[2.5px] rounded-full" style={{ background: "#33084E" }} />
              )}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="flex-1 overflow-y-auto" style={{ minHeight: "0" }}>
        {activeTab === "profile" && <ProfileTab />}
        {activeTab === "appearance" && <AppearanceTab />}
        {activeTab === "company" && <CompanyTab role={role} />}
        {activeTab === "passcodes" && isAdmin && <PasscodesTab />}
      </div>
    </div>
  );
}
