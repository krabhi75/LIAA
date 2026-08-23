"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Icon } from "./Icon";

const NAV = [
  { href: "/", icon: "dashboard", label: "Dashboard" },
  { href: "/crm/calls", icon: "settings_input_antenna", label: "Live Calls" },
  { href: "/crm", icon: "groups", label: "Farmers" },
  { href: "/crm#dialer", icon: "dialpad", label: "Dialer" },
  { href: "/crm/calls", icon: "call", label: "Calls" },
  { href: "/crm", icon: "folder_open", label: "Cases" },
  { href: "/demo", icon: "psychology", label: "Voice desk" },
  { href: "/telephony", icon: "settings", label: "Settings" },
] as const;

function activeFor(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  if (href.includes("#")) return pathname === href.split("#")[0];
  if (href === "/crm") {
    return pathname === "/crm" || pathname.startsWith("/crm/farmers");
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function Shell({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <div className="ks-body min-h-screen">
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-64 flex-col border-r border-ks-outline bg-ks-surface px-4 py-6 shadow-sm md:flex">
        <Brand />
        <Link
          href="/demo"
          className="mb-6 flex items-center justify-center gap-2 rounded-lg bg-ks-primary-container px-4 py-2.5 text-sm font-medium text-white transition hover:bg-ks-primary"
        >
          <Icon name="add" />
          New analysis
        </Link>
        <NavList pathname={pathname} />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-black/30"
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-64 flex-col bg-ks-surface px-4 py-6">
            <Brand />
            <NavList pathname={pathname} onClick={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}

      <header className="fixed right-0 top-0 z-40 flex h-16 w-full items-center justify-between border-b border-ks-outline bg-ks-surface px-4 md:w-[calc(100%-16rem)] md:px-8">
        <div className="flex items-center gap-3">
          <button
            className="rounded-full p-2 text-ks-primary hover:bg-ks-low md:hidden"
            type="button"
            onClick={() => setOpen(true)}
          >
            <Icon name="menu" />
          </button>
          <span className="ks-display text-lg font-bold text-ks-primary md:hidden">
            KrishiSaathi AI
          </span>
          <div className="hidden items-center gap-6 md:flex">
            <span className="ks-display border-b-2 border-ks-primary pb-1 text-sm font-medium text-ks-primary">
              {title}
            </span>
            <Link
              href="/demo"
              className="text-sm text-ks-muted hover:text-ks-primary"
            >
              Voice desk
            </Link>
            <Link
              href="/telephony"
              className="text-sm text-ks-muted hover:text-ks-primary"
            >
              SIP
            </Link>
          </div>
        </div>
        <div className="flex items-center gap-2 text-ks-muted">
          <span className="hidden text-xs md:inline">Liaa field desk</span>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-ks-primary-container text-xs font-semibold text-white">
            AK
          </span>
        </div>
      </header>

      <main className="min-h-screen px-4 pb-12 pt-24 md:ml-64 md:px-8">
        <div className="mx-auto max-w-[1440px]">{children}</div>
      </main>
    </div>
  );
}

function Brand() {
  return (
    <div className="mb-8 flex items-center gap-3 px-2">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-ks-primary-container text-white">
        <Icon name="eco" filled />
      </div>
      <div>
        <h1 className="ks-display truncate text-lg font-bold leading-tight text-ks-primary">
          KrishiSaathi AI
        </h1>
        <p className="text-[12px] font-semibold text-ks-muted">Liaa · Agri CRM</p>
      </div>
    </div>
  );
}

function NavList({
  pathname,
  onClick,
}: {
  pathname: string;
  onClick?: () => void;
}) {
  return (
    <nav className="flex flex-1 flex-col gap-1 overflow-y-auto">
      {NAV.map((item) => {
        const active = activeFor(pathname, item.href);
        return (
          <Link
            key={`${item.label}-${item.href}`}
            href={item.href}
            onClick={onClick}
            className={
              active
                ? "flex items-center gap-3 rounded-md border-r-4 border-ks-primary bg-ks-primary-container/10 px-3 py-2.5 text-sm font-bold text-ks-primary"
                : "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm text-ks-muted hover:bg-ks-low"
            }
          >
            <Icon name={item.icon} filled={active} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
