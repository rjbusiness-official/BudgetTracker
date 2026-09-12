"use client";

import type { ReactNode } from "react";
import type { LucideIcon } from "lucide-react";
import { X } from "lucide-react";
import { formatCurrency } from "@/src/utils/finance";

export const cn = (...classes: Array<string | false | null | undefined>) => classes.filter(Boolean).join(" ");

export function PageHeader({
  title,
  description,
  actions
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
      <div>
        <h1 className="text-2xl font-semibold tracking-normal text-slate-950 md:text-3xl">{title}</h1>
        {description ? <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-600">{description}</p> : null}
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
  );
}

export function Panel({ children, className }: { children: ReactNode; className?: string }) {
  return <section className={cn("rounded-lg border border-white bg-white p-4 shadow-[0_18px_45px_rgba(47,54,84,0.08)]", className)}>{children}</section>;
}

export function SummaryCard({
  label,
  value,
  helper,
  icon: Icon,
  tone = "neutral"
}: {
  label: string;
  value: string;
  helper?: string;
  icon: LucideIcon;
  tone?: "neutral" | "success" | "warning" | "danger" | "accent";
}) {
  const toneClass = {
    neutral: "bg-[#f0edff] text-[#3f3a78]",
    success: "bg-[#ddf8f2] text-[#168d78]",
    warning: "bg-[#fff3d2] text-[#a87509]",
    danger: "bg-[#ffe5eb] text-[#c43d5c]",
    accent: "bg-[#ece9ff] text-[#5b52e6]"
  }[tone];
  return (
    <div className="relative overflow-hidden rounded-lg border border-white bg-white p-4 shadow-[0_18px_45px_rgba(47,54,84,0.08)]">
      <div className="flex items-center justify-between gap-3">
        <span className="text-sm font-medium text-slate-500">{label}</span>
        <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", toneClass)}><Icon size={18} /></span>
      </div>
      <div className="mt-4 text-2xl font-semibold text-slate-950">{value}</div>
      {helper ? <p className="mt-1 text-sm text-slate-500">{helper}</p> : null}
    </div>
  );
}

export function MoneyDisplay({ value, className }: { value: number; className?: string }) {
  return <span className={cn("tabular-nums", className)}>{formatCurrency(value)}</span>;
}

export function ProgressBar({ value, tone = "success" }: { value: number; tone?: "success" | "warning" | "danger" | "accent" }) {
  const color = {
    success: "bg-[#2cc5a7]",
    warning: "bg-[#f5bd3d]",
    danger: "bg-[#ef5d7a]",
    accent: "bg-[#6c63f6]"
  }[tone];
  return (
    <div className="h-2 w-full overflow-hidden rounded-full bg-slate-100">
      <div className={cn("h-full rounded-full", color)} style={{ width: String(Math.max(0, Math.min(100, value))) + "%" }} />
    </div>
  );
}

export function StatusBadge({ label, tone = "neutral" }: { label: string; tone?: "neutral" | "success" | "warning" | "danger" | "accent" }) {
  const cls = {
    neutral: "border-[#ddd8ff] bg-[#f8f7ff] text-[#3f3a78]",
    success: "border-[#b8eee3] bg-[#effcf9] text-[#168d78]",
    warning: "border-[#f9dda0] bg-[#fff8e4] text-[#a87509]",
    danger: "border-[#fac1cf] bg-[#fff1f4] text-[#c43d5c]",
    accent: "border-[#d8d3ff] bg-[#f0edff] text-[#5b52e6]"
  }[tone];
  return <span className={cn("inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-semibold", cls)}>{label}</span>;
}

export function Button({
  children,
  type = "button",
  variant = "primary",
  className,
  onClick,
  disabled,
  title
}: {
  children: ReactNode;
  type?: "button" | "submit" | "reset";
  variant?: "primary" | "secondary" | "ghost" | "danger";
  className?: string;
  onClick?: () => void;
  disabled?: boolean;
  title?: string;
}) {
  const cls = {
    primary: "bg-[#6c63f6] text-white shadow-[0_12px_24px_rgba(103,93,198,0.28)] hover:bg-[#5b52e6]",
    secondary: "border border-white bg-white text-slate-500 shadow-[0_12px_26px_rgba(47,54,84,0.08)] hover:bg-[#f0edff]",
    ghost: "text-slate-500 hover:bg-[#f0edff]",
    danger: "bg-[#ef5d7a] text-white hover:bg-[#d94f6c]"
  }[variant];
  return (
    <button type={type} className={cn("inline-flex min-h-10 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50", cls, className)} onClick={onClick} disabled={disabled} title={title}>
      {children}
    </button>
  );
}

export function Field({ label, children, hint }: { label: string; children: ReactNode; hint?: string }) {
  return (
    <label className="grid gap-1.5 text-sm font-medium text-slate-700">
      <span>{label}</span>
      {children}
      {hint ? <span className="text-xs font-normal text-slate-500">{hint}</span> : null}
    </label>
  );
}

export const inputClass = "min-h-10 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-[#6c63f6] focus:ring-2 focus:ring-[#d8d3ff]";

export function EmptyState({ title, description }: { title: string; description: string }) {
  return (
    <div className="rounded-lg border border-dashed border-slate-300 p-6 text-center">
      <p className="font-semibold text-slate-900">{title}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
  );
}

export function Modal({ title, children, onClose }: { title: string; children: ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-[#ded8ff]/55 p-0 backdrop-blur-sm md:items-center md:p-6">
      <div className="max-h-[92vh] w-full overflow-auto rounded-t-2xl border border-slate-200 bg-white p-5 shadow-[0_28px_80px_rgba(103,93,198,0.20)] md:max-w-2xl md:rounded-2xl">
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="text-lg font-semibold text-slate-950">{title}</h2>
          <button className="flex h-10 w-10 items-center justify-center rounded-lg text-slate-500 hover:bg-slate-100" onClick={onClose} aria-label="Close modal" type="button">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
