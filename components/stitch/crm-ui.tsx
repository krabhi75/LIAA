"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { Icon } from "./Icon";

export const CASE_DISPOSITIONS = [
  { value: "resolved", label: "Resolved — advisory delivered", closes: true },
  { value: "completed", label: "Completed — farmer satisfied", closes: true },
  { value: "closed", label: "Closed — no further action", closes: true },
  { value: "follow_up", label: "Follow-up required", closes: false },
  { value: "escalated", label: "Escalated to agri expert", closes: false },
  { value: "duplicate", label: "Duplicate / invalid record", closes: true },
] as const;

export type CaseDisposition = (typeof CASE_DISPOSITIONS)[number]["value"];

export function dispositionToCaseStatus(disposition: CaseDisposition): string {
  switch (disposition) {
    case "resolved":
    case "completed":
    case "closed":
    case "duplicate":
      return disposition === "duplicate" ? "closed" : disposition;
    case "follow_up":
      return "open";
    case "escalated":
      return "escalated";
    default: {
      const _never: never = disposition;
      return _never;
    }
  }
}

export function isCaseOpen(status: string): boolean {
  const s = status.toLowerCase();
  return s === "open" || s === "" || s === "follow_up" || s === "escalated";
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
  meta,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: ReactNode;
  meta?: ReactNode;
}) {
  return (
    <header className="ks-page-header mb-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          {eyebrow ? (
            <p className="ks-page-eyebrow">{eyebrow}</p>
          ) : null}
          <h1 className="ks-display ks-page-title">{title}</h1>
          {description ? (
            <p className="ks-page-desc mt-1 max-w-3xl">{description}</p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {meta}
          {actions}
        </div>
      </div>
    </header>
  );
}

export function MetricTile({
  label,
  value,
  hint,
  tone = "default",
}: {
  label: string;
  value: string | number;
  hint?: string;
  tone?: "default" | "live" | "warn";
}) {
  return (
    <div className={`ks-metric ${tone === "live" ? "ks-metric--live" : ""} ${tone === "warn" ? "ks-metric--warn" : ""}`}>
      <p className="ks-metric__label">{label}</p>
      <p className="ks-metric__value">{value}</p>
      {hint ? <p className="ks-metric__hint">{hint}</p> : null}
    </div>
  );
}

export function StatusBadge({
  label,
  tone = "neutral",
}: {
  label: string;
  tone?: "neutral" | "live" | "success" | "warn" | "error" | "brand";
}) {
  return (
    <span className={`ks-badge ks-badge--${tone}`}>
      {tone === "live" ? (
        <span className="ks-badge__dot ks-pulse" aria-hidden />
      ) : tone !== "neutral" ? (
        <span className="ks-badge__dot" aria-hidden />
      ) : null}
      {label}
    </span>
  );
}

export function caseStatusTone(
  status: string,
): "neutral" | "live" | "success" | "warn" | "error" | "brand" {
  const s = status.toLowerCase();
  if (s === "escalated") return "warn";
  if (["resolved", "completed", "closed"].includes(s)) return "success";
  if (s === "open" || s === "follow_up") return "brand";
  if (s === "failed") return "error";
  return "neutral";
}

export function RecordPanel({
  title,
  icon,
  children,
  action,
}: {
  title: string;
  icon?: string;
  children: ReactNode;
  action?: ReactNode;
}) {
  return (
    <section className="ks-record-panel">
      <div className="ks-record-panel__head">
        <h3 className="ks-record-panel__title">
          {icon ? <Icon name={icon} className="text-[18px]" /> : null}
          {title}
        </h3>
        {action}
      </div>
      <div className="ks-record-panel__body">{children}</div>
    </section>
  );
}

export function CrmButton({
  children,
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: "primary" | "secondary" | "ghost" | "brand";
}) {
  return (
    <button
      type={type}
      className={`ks-btn ks-btn--${variant} ${className}`.trim()}
      {...props}
    >
      {children}
    </button>
  );
}

export function CrmLinkButton({
  href,
  children,
  variant = "secondary",
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
}) {
  return (
    <Link href={href} className={`ks-btn ks-btn--${variant}`}>
      {children}
    </Link>
  );
}

export function DataTableShell({
  title,
  subtitle,
  children,
  footer,
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
}) {
  return (
    <div className="ks-datatable">
      <div className="ks-datatable__toolbar">
        <div>
          <p className="ks-datatable__title">{title}</p>
          {subtitle ? (
            <p className="ks-datatable__subtitle">{subtitle}</p>
          ) : null}
        </div>
      </div>
      <div className="overflow-x-auto">{children}</div>
      {footer ? <div className="ks-datatable__footer">{footer}</div> : null}
    </div>
  );
}
