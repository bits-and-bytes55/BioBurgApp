import React from "react";
import { CircularProgress } from "@mui/material";

export const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

export const formatNumber = (value) =>
  Number(value || 0).toLocaleString("en-IN", {
    maximumFractionDigits: 0,
  });

export const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
      })
    : "-";

export const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const joinClasses = (...classes) => classes.filter(Boolean).join(" ");

export function FranchiseConsoleStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Manrope:wght@400;500;600;700;800&family=Space+Grotesk:wght@500;700&family=JetBrains+Mono:wght@500;700&display=swap');

      .franchise-console-root {
        --console-bg: #f5f7fa;
        --console-panel: rgba(255, 255, 255, 0.92);
        --console-panel-strong: rgba(255, 255, 255, 0.98);
        --console-line: rgba(0, 0, 0, 0.07);
        --console-line-soft: rgba(0, 0, 0, 0.05);
        --console-text: #111827;
        --console-muted: #64748b;
        --console-muted-strong: #475569;
        --console-gold: #ca8a04;
        --console-gold-strong: #92400e;
        --console-teal: #0d9488;
        --console-rose: #dc2626;
        --console-blue: #2563eb;
        color: var(--console-text);
        font-family: 'Manrope', sans-serif;
      }

      .franchise-console-root .console-display {
        font-family: 'Space Grotesk', sans-serif;
      }

      .franchise-console-root .console-mono {
        font-family: 'JetBrains Mono', monospace;
      }

      .franchise-console-root ::selection {
        background: rgba(202, 138, 4, 0.18);
        color: #78350f;
      }

      .franchise-console-root ::-webkit-scrollbar {
        width: 6px;
        height: 6px;
      }

      .franchise-console-root ::-webkit-scrollbar-track {
        background: transparent;
      }

      .franchise-console-root ::-webkit-scrollbar-thumb {
        background: rgba(100, 116, 139, 0.85);
        border-radius: 999px;
      }

      .franchise-console-root ::-webkit-scrollbar-thumb:hover {
        background: rgba(202, 138, 4, 0.38);
      }

      .franchise-console-root input[type="date"]::-webkit-calendar-picker-indicator {
        filter: none;
        cursor: pointer;
        opacity: 0.55;
      }

      /* ── Table ── */
      .franchise-console-root .franchise-console-table {
        border-collapse: separate;
        border-spacing: 0 8px;
      }

      .franchise-console-root .franchise-console-table tbody td {
        background: #ffffff;
        box-shadow:
          0 1px 3px rgba(0,0,0,0.05),
          0 0 0 1px rgba(0,0,0,0.055);
      }

      .franchise-console-root .franchise-console-table tbody tr:hover td {
        background: #fafafa;
        box-shadow:
          0 2px 8px rgba(0,0,0,0.07),
          0 0 0 1px rgba(202,138,4,0.18);
      }

      .franchise-console-root .franchise-console-table tbody td:first-child {
        border-radius: 16px 0 0 16px;
      }

      .franchise-console-root .franchise-console-table tbody td:last-child {
        border-radius: 0 16px 16px 0;
      }

      /* ── Dialog ── */
      .franchise-console-root .franchise-console-dialog .MuiDialog-paper {
        background: #ffffff;
        color: #111827;
        border: 1px solid rgba(0, 0, 0, 0.08);
        border-radius: 24px;
        box-shadow: 0 24px 72px rgba(0, 0, 0, 0.14);
      }

      .franchise-console-root .franchise-console-dialog .MuiDialogTitle-root,
      .franchise-console-root .franchise-console-dialog .MuiDialogContent-root,
      .franchise-console-root .franchise-console-dialog .MuiDialogActions-root {
        border-color: rgba(0, 0, 0, 0.08);
      }
    `}</style>
  );
}

export function ConsolePage({ children, className = "" }) {
  return (
    <div className={joinClasses("franchise-console-root", className)}>
      <FranchiseConsoleStyles />
      {children}
    </div>
  );
}

export function ConsoleHeader({
  eyebrow = "Franchise Operating Suite",
  title,
  description,
  badges,
  actions,
}) {
  return (
    <section className="relative overflow-hidden rounded-[28px] border border-black/[0.07] bg-white px-6 py-6 shadow-[0_4px_24px_rgba(0,0,0,0.07)]">
      {/* Decorative ambient glows */}
      <div className="pointer-events-none absolute -right-12 -top-8 h-40 w-40 rounded-full bg-amber-100/60 blur-3xl" />
      <div className="pointer-events-none absolute -left-12 bottom-0 h-32 w-32 rounded-full bg-blue-100/40 blur-3xl" />

      <div className="relative z-10 flex flex-col gap-5 xl:flex-row xl:items-end xl:justify-between">
        <div className="max-w-4xl">
          <div className="mb-3 flex flex-wrap items-center gap-3">
            <span className="console-mono rounded-full border border-amber-300/60 bg-amber-50 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.32em] text-amber-700">
              {eyebrow}
            </span>
            <span className="rounded-full border border-black/[0.08] bg-slate-50 px-3 py-1 text-[11px] font-medium text-slate-500">
              Premium operations workspace
            </span>
          </div>

          <h1 className="console-display max-w-4xl text-3xl font-bold tracking-[-0.04em] text-gray-900 md:text-[2.2rem]">
            {title}
          </h1>

          {description ? (
            <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500 md:text-[15px]">
              {description}
            </p>
          ) : null}
        </div>

        {actions ? (
          <div className="flex flex-wrap gap-2 rounded-[20px] border border-black/[0.07] bg-slate-50 p-2">
            {actions}
          </div>
        ) : null}
      </div>

      {badges ? (
        <div className="relative z-10 mt-5 flex flex-wrap gap-2 border-t border-black/[0.06] pt-4">
          {badges}
        </div>
      ) : null}
    </section>
  );
}

export function ConsolePanel({ title, subtitle, action, children, className = "" }) {
  return (
    <section
      className={joinClasses(
        "group relative overflow-hidden rounded-[24px] border border-black/[0.07] bg-white shadow-[0_2px_16px_rgba(0,0,0,0.06)] transition-all duration-300 hover:shadow-[0_4px_24px_rgba(0,0,0,0.09)] hover:border-black/[0.10]",
        className,
      )}
    >
      {/* Top-left amber accent line */}
      <div className="pointer-events-none absolute left-6 top-0 h-px w-20 bg-gradient-to-r from-amber-400/60 to-transparent" />

      {(title || subtitle || action) ? (
        <div className="relative z-10 flex flex-col gap-4 border-b border-black/[0.06] px-5 py-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            {title ? (
              <h2 className="console-display text-[1.05rem] font-semibold tracking-[-0.02em] text-gray-800">
                {title}
              </h2>
            ) : null}
            {subtitle ? (
              <p className="mt-1.5 text-sm leading-6 text-slate-400">{subtitle}</p>
            ) : null}
          </div>
          {action ? <div className="shrink-0">{action}</div> : null}
        </div>
      ) : null}

      <div className="relative z-10 px-5 py-5">{children}</div>
    </section>
  );
}

export function ConsoleMetricCard({
  label,
  primary,
  secondary,
  accent = false,
  className = "",
}) {
  return (
    <div
      className={joinClasses(
        "group relative overflow-hidden rounded-[22px] border border-black/[0.07] bg-white p-5 shadow-[0_2px_12px_rgba(0,0,0,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:shadow-[0_6px_24px_rgba(0,0,0,0.09)] hover:border-black/[0.10]",
        className,
      )}
    >
      <div className="pointer-events-none absolute inset-0">
        <div
          className={`absolute inset-x-0 top-0 h-px ${
            accent
              ? "bg-gradient-to-r from-transparent via-amber-400 to-transparent"
              : "bg-gradient-to-r from-transparent via-black/[0.06] to-transparent"
          }`}
        />
        <div
          className={`absolute -right-8 top-0 h-24 w-24 rounded-full blur-3xl ${
            accent ? "bg-amber-100" : "bg-slate-100/80"
          }`}
        />
      </div>

      <div className="relative z-10">
        <span className="text-[10px] font-semibold uppercase tracking-[0.3em] text-slate-400">
          {label}
        </span>
        <div
          className={joinClasses(
            "console-display mt-3 text-[2rem] font-bold tracking-[-0.05em]",
            accent ? "text-amber-700" : "text-gray-800",
          )}
        >
          {primary}
        </div>
        {secondary ? (
          <p className="mt-2 text-xs leading-6 text-slate-400">{secondary}</p>
        ) : null}
      </div>
    </div>
  );
}

export function ConsoleBadge({ children, tone = "neutral" }) {
  const tones = {
    neutral: "border-black/[0.08] bg-slate-50 text-slate-500",
    amber:   "border-amber-300/50 bg-amber-50 text-amber-700",
    green:   "border-emerald-300/50 bg-emerald-50 text-emerald-700",
    blue:    "border-blue-300/50 bg-blue-50 text-blue-700",
    rose:    "border-red-300/50 bg-red-50 text-red-700",
  };

  return (
    <span
      className={joinClasses(
        "inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold",
        tones[tone] || tones.neutral,
      )}
    >
      {children}
    </span>
  );
}

export function ConsoleButton({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}) {
  const variants = {
    primary:
      "border border-amber-400/70 bg-[linear-gradient(135deg,#fbbf24,#d97706)] text-white shadow-[0_4px_14px_rgba(217,119,6,0.28)] hover:brightness-105",
    secondary:
      "border border-black/[0.09] bg-white text-slate-600 hover:border-amber-300/60 hover:bg-amber-50 hover:text-amber-800",
    ghost:
      "text-slate-400 hover:text-slate-700",
    danger:
      "border border-red-200 bg-red-50 text-red-700 hover:bg-red-100",
  };

  return (
    <button
      type={type}
      className={joinClasses(
        "inline-flex items-center justify-center gap-2 rounded-[14px] px-4 py-2.5 text-sm font-semibold transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-45",
        variants[variant] || variants.secondary,
        className,
      )}
      {...props}
    >
      {children}
    </button>
  );
}

export function ConsoleNotice({ tone = "info", children }) {
  const tones = {
    info:    "border-blue-200 bg-blue-50 text-blue-800",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
    error:   "border-red-200 bg-red-50 text-red-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
  };

  const accents = {
    info:    "bg-blue-400",
    warning: "bg-amber-400",
    error:   "bg-red-400",
    success: "bg-emerald-400",
  };

  return (
    <div
      className={joinClasses(
        "relative overflow-hidden rounded-[18px] border px-4 py-4 text-sm leading-6",
        tones[tone],
      )}
    >
      <div className={joinClasses("absolute inset-y-0 left-0 w-1 rounded-l-[18px]", accents[tone])} />
      <div className="relative pl-3">{children}</div>
    </div>
  );
}

export function ConsoleEmptyState({ title, text }) {
  return (
    <div className="grid min-h-[200px] place-items-center rounded-[22px] border border-dashed border-black/[0.10] bg-slate-50/70 px-5 text-center">
      <div className="max-w-md">
        <div className="console-mono text-xs uppercase tracking-[0.34em] text-slate-400">
          No active records
        </div>
        <div className="mt-3 text-base font-semibold text-gray-700">{title}</div>
        {text ? <div className="mt-2 text-sm leading-6 text-slate-400">{text}</div> : null}
      </div>
    </div>
  );
}

export function ConsoleLoading({ label = "Loading franchise workspace..." }) {
  return (
    <div className="flex min-h-[45vh] items-center justify-center">
      <div className="flex flex-col items-center gap-4 rounded-[22px] border border-black/[0.07] bg-white px-8 py-7 shadow-[0_4px_20px_rgba(0,0,0,0.07)]">
        <CircularProgress size={28} sx={{ color: "#d97706" }} />
        <span className="console-mono text-[11px] uppercase tracking-[0.32em] text-slate-400">
          {label}
        </span>
      </div>
    </div>
  );
}

export const consoleInputClass =
  "w-full rounded-[14px] border border-black/[0.09] bg-white px-4 py-2.5 text-sm text-gray-800 outline-none transition-all duration-200 placeholder:text-slate-400 focus:border-amber-400/70 focus:ring-2 focus:ring-amber-100";

export const consoleTextareaClass = `${consoleInputClass} min-h-[140px] resize-y`;

export const consoleTableHeadClass =
  "px-4 py-3 text-left text-[10px] font-semibold uppercase tracking-[0.28em] text-slate-400";

export const consoleTableCellClass =
  "px-4 py-3.5 text-sm text-gray-700 align-top";