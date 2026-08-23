"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";
import { Icon } from "./Icon";

const NAV_SECTIONS = [
  {
    label: "Home",
    items: [{ href: "/", icon: "dashboard", label: "Overview" }],
  },
  {
    label: "CRM",
    items: [
      { href: "/crm", icon: "groups", label: "Farmers" },
      { href: "/crm/calls", icon: "settings_input_antenna", label: "Live calls" },
    ],
  },
  {
    label: "Voice",
    items: [
      { href: "/pitch", icon: "movie", label: "2-min pitch" },
      { href: "/demo", icon: "psychology", label: "Voice desk" },
      { href: "/telephony", icon: "settings", label: "Telephony" },
    ],
  },
] as const;

function activeFor(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
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
      <aside className="fixed left-0 top-0 z-50 hidden h-screen w-60 flex-col border-r border-ks-outline bg-[#032d60] px-3 py-5 md:flex">
        <Brand />
        <Link
          href="/crm#dialer"
          className="mb-5 flex items-center justify-center gap-2 rounded-md bg-[#0176d3] px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-[#014486]"
        >
          <Icon name="add" />
          New outbound
        </Link>
        <NavList pathname={pathname} />
      </aside>

      {open ? (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            className="absolute inset-0 bg-black/40"
            type="button"
            aria-label="Close menu"
            onClick={() => setOpen(false)}
          />
          <aside className="relative z-10 flex h-full w-60 flex-col bg-[#032d60] px-3 py-5">
            <Brand />
            <NavList pathname={pathname} onClick={() => setOpen(false)} />
          </aside>
        </div>
      ) : null}

      <header className="fixed right-0 top-0 z-40 flex h-14 w-full items-center justify-between border-b border-ks-outline bg-ks-surface px-4 md:w-[calc(100%-15rem)] md:px-6">
        <div className="flex items-center gap-3">
          <button
            className="rounded-md p-2 text-ks-primary hover:bg-ks-low md:hidden"
            type="button"
            onClick={() => setOpen(true)}
          >
            <Icon name="menu" />
          </button>
          <div>
            <p className="hidden text-[10px] font-semibold uppercase tracking-wider text-ks-muted md:block">
              KrishiSaathi CRM
            </p>
            <span className="ks-display text-base font-bold text-ks-on-surface">
              {title}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 text-ks-muted">
          <Link
            href="/demo"
            className="hidden text-xs font-medium text-ks-primary-container hover:underline sm:inline"
          >
            Voice desk
          </Link>
          <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[#0176d3] text-xs font-bold text-white">
            KS
          </span>
        </div>
      </header>

      <main className="min-h-screen px-4 pb-12 pt-[4.25rem] md:ml-60 md:px-6">
        <div className="mx-auto max-w-[1440px]">{children}</div>
      </main>
    </div>
  );
}

function Brand() {
  return (
    <div className="mb-6 flex items-center gap-3 px-2">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-white/10 text-white">
        <Icon name="eco" filled />
      </div>
      <div>
        <h1 className="ks-display truncate text-base font-bold leading-tight text-white">
          KrishiSaathi
        </h1>
        <p className="text-[11px] font-medium text-white/70">Field CRM · Liaa</p>
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
      {NAV_SECTIONS.map((section) => (
        <div key={section.label}>
          <p className="ks-nav-section text-white/50">{section.label}</p>
          {section.items.map((item) => {
            const active = activeFor(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClick}
                className={
                  active
                    ? "flex items-center gap-3 rounded-md bg-white/15 px-3 py-2 text-sm font-semibold text-white"
                    : "flex items-center gap-3 rounded-md px-3 py-2 text-sm text-white/80 hover:bg-white/10"
                }
              >
                <Icon name={item.icon} filled={active} />
                {item.label}
              </Link>
            );
          })}
        </div>
      ))}
    </nav>
  );
}
