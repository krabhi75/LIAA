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
    <div className="flex min-h-screen bg-[#f4f6f8]">
      <aside className="flex w-56 shrink-0 flex-col bg-slate-900 text-slate-300">
        <div className="border-b border-white/10 px-5 py-5">
          <Link href="/app" className="text-sm font-semibold text-white">
            MolVaani Cloud
          </Link>
          <div className="mt-1 truncate text-[11px] text-slate-400">
            {user.orgName}
          </div>
        </div>
        <nav className="flex-1 space-y-1 px-3 py-4">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="block rounded-md px-3 py-2 text-sm hover:bg-white/5 hover:text-white"
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/demo"
            className="block rounded-md px-3 py-2 text-sm text-emerald-400 hover:bg-white/5"
          >
            Public demo desk
          </Link>
        </nav>
        <div className="border-t border-white/10 px-4 py-4 text-xs">
          <div className="truncate text-white">{user.email}</div>
          <div className="mt-1 capitalize text-slate-500">
            {user.plan} · {user.role}
          </div>
          <button
            type="button"
            className="mt-3 text-slate-400 hover:text-white"
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
        <header className="flex h-14 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div>
            <h1 className="text-sm font-semibold text-slate-900">{title}</h1>
            {subtitle ? (
              <p className="text-xs text-slate-500">{subtitle}</p>
            ) : null}
          </div>
          <Link
            href="/app/live"
            className="rounded-md bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-500"
          >
            Start live call
          </Link>
        </header>
        <main className="flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}
