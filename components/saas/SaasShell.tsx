"use client";

import Link from "next/link";
import type { ReactNode } from "react";

export type ShellUser = {
  email: string;
  orgName: string;
  plan: string;
  role: string;
};

const NAV = [
  { href: "/app", label: "Overview" },
  { href: "/app/live", label: "Live call" },
  { href: "/app/agents", label: "Agents" },
  { href: "/app/leads", label: "Leads" },
  { href: "/app/billing", label: "Billing" },
];

export function SaasShell({
  user,
  children,
  title,
  subtitle,
}: {
  user: ShellUser;
  children: ReactNode;
  title: string;
  subtitle?: string;
}) {
  return (
    <div className="saas-paper flex min-h-screen">
      <aside className="flex w-56 shrink-0 flex-col border-r border-[var(--line)] bg-[var(--surface)] text-[var(--ink-2)]">
        <div className="border-b border-[var(--line)] px-5 py-5">
          <Link href="/app" className="nova-mark text-[var(--ink)]">
            MOLVAANI
          </Link>
          <div className="mt-1 truncate text-[11px] text-[var(--ink-3)]">
            {user.orgName}
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-[var(--radius)] px-3 py-2 text-sm hover:bg-[var(--sunk)]"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/demo"
            className="block rounded-[var(--radius)] px-3 py-2 text-sm text-[var(--nova)] hover:bg-[var(--nova-soft)]"
          >
            Public demo desk
          </Link>
        </nav>
        <div className="border-t border-[var(--line)] px-4 py-4 text-xs">
          <div className="truncate text-[var(--ink)]">{user.email}</div>
          <div className="mt-1 capitalize text-[var(--ink-3)]">
            {user.plan} · {user.role}
          </div>
          <button
            type="button"
            className="mt-3 text-[var(--ink-3)] hover:text-[var(--ink)]"
            onClick={async () => {
              await fetch("/api/auth/logout", { method: "POST" });
              window.location.href = "/login";
            }}
          >
            Sign out
          </button>
        </div>
      </aside>
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-[52px] items-center justify-between border-b border-[var(--line)] bg-[var(--surface)] px-6">
          <div>
            <h1 className="text-sm font-semibold text-[var(--ink)]">{title}</h1>
            {subtitle ? (
              <p className="text-xs text-[var(--ink-3)]">{subtitle}</p>
            ) : null}
          </div>
          <Link href="/app/live" className="nova-btn nova-btn--primary" style={{ padding: "7px 14px", fontSize: 13 }}>
            Wake live call
          </Link>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
