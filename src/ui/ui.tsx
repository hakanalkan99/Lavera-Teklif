import React from "react";

export function Screen({ children }: { children: React.ReactNode }) {
  return <div className="min-h-screen bg-neutral-50 text-neutral-900">{children}</div>;
}

export function TopBar({ title, right }: { title: string; right?: React.ReactNode }) {
  return (
    <div className="sticky top-0 z-10 bg-white/90 backdrop-blur border-b border-neutral-200">
      <div className="max-w-md mx-auto px-4 py-3 flex items-center justify-between">
        <div className="font-semibold text-base truncate pr-2">{title}</div>
        <div className="shrink-0">{right}</div>
      </div>
    </div>
  );
}

export function Card({ children }: { children: React.ReactNode }) {
  return <div className="bg-white border border-neutral-200 rounded-2xl shadow-sm">{children}</div>;
}

export function Button({
  children,
  onClick,
  variant = "primary",
  disabled,
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: "primary" | "ghost" | "danger";
  disabled?: boolean;
}) {
  const base =
    "px-3 py-2 rounded-xl text-sm font-medium transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-neutral-900 text-white hover:bg-neutral-800"
      : variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-500"
      : "bg-transparent text-neutral-900 hover:bg-neutral-100";
  return (
    <button className={`${base} ${styles}`} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function Pill({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-2 rounded-full text-sm font-medium border transition ${
        active
          ? "bg-neutral-900 text-white border-neutral-900"
          : "bg-white text-neutral-800 border-neutral-200 hover:bg-neutral-100"
      }`}
    >
      {label}
    </button>
  );
}

export function Input({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
}) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-neutral-700 mb-1">{label}</div>
      <input
        className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
}

export function TextArea({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
}) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-neutral-700 mb-1">{label}</div>
      <textarea
        className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10 min-h-[88px]"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </label>
  );
}

export function Select({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="block">
      <div className="text-xs font-medium text-neutral-700 mb-1">{label}</div>
      <select
        className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-neutral-900/10"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/30" onClick={onClose} />
      <div className="relative w-full sm:w-[420px] bg-white rounded-t-3xl sm:rounded-3xl shadow-xl border border-neutral-200">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div className="font-semibold">{title}</div>
          <Button variant="ghost" onClick={onClose}>
            Kapat
          </Button>
        </div>
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  );
}
