"use client";

import Link from "next/link";
import type { ReactNode } from "react";

type NavId = "live" | "human";

export function AppShell({
  children,
  active,
  channel,
  status,
  duration,
  ist,
  mcpAttached,
  connected,
  connecting,
  onStart,
  onStop,
  startDisabled,
}: {
  children: ReactNode;
  active: NavId;
  channel: string;
  status: string;
  duration: string;
  ist: string;
  mcpAttached: boolean;
  connected: boolean;
  connecting: boolean;
  onStart: () => void;
  onStop: () => void;
  startDisabled?: boolean;
}) {
  const humanHref = `/human?channel=${encodeURIComponent(channel)}`;

  return (
    <div className="flex h-screen min-h-0 bg-[#f4f6f8]">
      <aside className="flex w-60 shrink-0 flex-col bg-slate-900 text-slate-300">
        <div className="border-b border-white/10 px-5 py-5">
          <div className="text-sm font-semibold tracking-tight text-white">MolVaani</div>
          <div className="mt-1 text-[11px] text-slate-400">Voice revenue desk</div>
        </div>

        <nav className="flex-1 space-y-1 px-3 py-4">
          <NavItem href="/" active={active === "live"} label="Live call" />
          <NavItem href={humanHref} active={active === "human"} label="Human specialist" />
          <a
            href="https://whimsical.com/aetherclose-architecture-echosphere-ps21-Sp4yxNN5P85iFaowhtygnj"
            target="_blank"
            rel="noreferrer"
            className="block rounded-md px-3 py-2 text-sm text-slate-300 hover:bg-white/5 hover:text-white"
          >
            Architecture
          </a>
        </nav>

        <div className="space-y-3 border-t border-white/10 px-4 py-4">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Status</span>
            <span className="text-white">{status}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">Duration</span>
            <span className="num text-white">{duration}</span>
          </div>
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-400">IST</span>
            <span className="num text-white">{ist}</span>
          </div>
          <div className="truncate text-[10px] text-slate-500" title={channel}>
            {channel || "No channel"}
          </div>
          {mcpAttached ? (
            <div className="text-[11px] font-medium text-emerald-400">MCP live</div>
          ) : (
            <div className="text-[11px] text-slate-500">CRM tools need the HTTPS tunnel</div>
          )}
          {!connected ? (
            <button
              onClick={onStart}
              disabled={startDisabled || connecting}
              className="w-full rounded-md bg-blue-600 px-3 py-2 text-sm font-medium text-white hover:bg-blue-500 disabled:opacity-45"
            >
              {connecting ? "Connecting…" : "Start live call"}
            </button>
          ) : (
            <button
              onClick={onStop}
              className="w-full rounded-md bg-red-600 px-3 py-2 text-sm font-medium text-white hover:bg-red-500"
            >
              End call
            </button>
          )}
        </div>
      </aside>

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200 bg-white px-6">
          <div>
            <h1 className="text-sm font-semibold text-slate-900">
              {active === "human" ? "Human specialist" : "Live call"}
            </h1>
            <p className="text-xs text-slate-500">EchoSphere PS21 · Agora Conversational AI</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <span
              className={`h-2 w-2 rounded-full ${
                connected
                  ? status.toLowerCase().includes("speaking")
                    ? "speak-dot bg-blue-600"
                    : "live-dot bg-emerald-600"
                  : connecting
                    ? "speak-dot bg-amber-500"
                    : "bg-slate-300"
              }`}
            />
            {connecting ? "Connecting" : status}
          </div>
        </header>
        <main className="min-h-0 flex-1 overflow-auto p-6">{children}</main>
      </div>
    </div>
  );
}

function NavItem({
  href,
  active,
  label,
}: {
  href: string;
  active: boolean;
  label: string;
}) {
  return (
    <Link
      href={href}
      className={`block rounded-md px-3 py-2 text-sm ${
        active
          ? "bg-white/10 font-medium text-white"
          : "text-slate-300 hover:bg-white/5 hover:text-white"
      }`}
    >
      {label}
    </Link>
  );
}
