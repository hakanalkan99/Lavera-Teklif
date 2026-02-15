import React from "react";

export function Screen({ children }) {
  return <div className="min-h-screen bg-neutral-950 text-neutral-50">{children}</div>;
}

export function TopBar({ title, right }) {
  return (
    <div className="sticky top-0 z-20 backdrop-blur bg-neutral-950/70 border-b border-white/10">
      <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between gap-3">
        <div className="text-xl font-black tracking-tight truncate">{title}</div>
        <div className="shrink-0">{right}</div>
      </div>
    </div>
  );
}

export function Card({ children }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 shadow-[0_10px_30px_rgba(0,0,0,0.25)]">
      {children}
    </div>
  );
}

export function Button({ children, onClick, variant = "primary", disabled, type }) {
  const base =
    "px-3 py-2 rounded-xl text-sm font-bold transition active:scale-[0.99] disabled:opacity-50 disabled:cursor-not-allowed";
  const styles =
    variant === "primary"
      ? "bg-white text-neutral-950 hover:bg-white/90"
      : variant === "danger"
      ? "bg-red-600 text-white hover:bg-red-500"
      : "bg-white/10 text-white hover:bg-white/15 border border-white/10";
  return (
    <button className={`${base} ${styles}`} onClick={onClick} disabled={disabled} type={type}>
      {children}
    </button>
  );
}

export function Input({ label, value, onChange, placeholder, type = "text" }) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-white/70 mb-1">{label}</div>
      <input
        className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white placeholder:text-white/30 focus:outline-none focus:ring-2 focus:ring-white/15"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        type={type}
      />
    </label>
  );
}

export function Select({ label, value, onChange, options }) {
  return (
    <label className="block">
      <div className="text-xs font-semibold text-white/70 mb-1">{label}</div>
      <select
        className="w-full px-3 py-2 rounded-xl border border-white/10 bg-white/5 text-white focus:outline-none focus:ring-2 focus:ring-white/15"
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

export function Modal({ open, title, children, onClose }) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div className="relative w-full sm:w-[520px] rounded-t-3xl sm:rounded-3xl border border-white/10 bg-neutral-950 shadow-2xl">
        <div className="px-4 pt-4 pb-2 flex items-center justify-between">
          <div className="font-black">{title}</div>
          <Button variant="ghost" onClick={onClose}>
            Kapat
          </Button>
        </div>
        <div className="px-4 pb-4">{children}</div>
      </div>
    </div>
  );
}