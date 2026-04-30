import React from "react";

type Variant = "primary" | "secondary" | "danger";

interface ModalButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  children: React.ReactNode;
}

const variantClasses: Record<Variant, string> = {
  primary:
    "bg-(--accent-purple) text-white hover:opacity-90 shadow-[0_4px_14px_rgba(51,8,78,0.25)]",
  secondary:
    "border border-[#f0f0f5] bg-white text-(--text-primary) hover:bg-slate-50",
  danger:
    "bg-[#ef4444] text-white hover:opacity-90 shadow-[0_4px_14px_rgba(239,68,68,0.25)]",
};

export function ModalButton({
  variant = "secondary",
  children,
  className = "",
  style,
  ...props
}: ModalButtonProps) {
  return (
    <button
      className={[
        "inline-flex items-center justify-center gap-2 rounded-xl text-[13px] font-bold",
        "transition-all cursor-pointer focus:outline-none",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        variantClasses[variant],
        className,
      ].join(" ")}
      style={{ padding: "10px 20px", ...style }}
      {...props}
    >
      {children}
    </button>
  );
}
