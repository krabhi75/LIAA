"use client";

import { useState } from "react";

export function BillingActions() {
  const [message, setMessage] = useState<string | null>(null);

  async function upgrade(plan: "pro" | "business") {
    const res = await fetch("/api/billing/checkout", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ plan }),
    });
    const data = await res.json();
    setMessage(data.message ?? data.error ?? "Done");
  }

  return (
    <div className="mt-4 flex flex-wrap items-center gap-3">
      <button
        type="button"
        onClick={() => upgrade("pro")}
        className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-500"
      >
        Upgrade to Pro
      </button>
      <button
        type="button"
        onClick={() => upgrade("business")}
        className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium hover:bg-slate-50"
      >
        Upgrade to Business
      </button>
      {message ? (
        <span className="text-sm text-slate-600">{message}</span>
      ) : null}
    </div>
  );
}
