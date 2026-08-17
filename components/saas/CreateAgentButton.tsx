"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";

export function CreateAgentButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  return (
    <button
      type="button"
      disabled={loading}
      className="rounded-md bg-slate-900 px-3 py-1.5 text-sm font-medium text-white hover:bg-slate-800"
      onClick={async () => {
        setLoading(true);
        const res = await fetch("/api/org/agents", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name: "New voice agent" }),
        });
        setLoading(false);
        if (!res.ok) return;
        const data = await res.json();
        router.push(`/app/agents/${data.agent.id}`);
        router.refresh();
      }}
    >
      {loading ? "Creating…" : "New agent"}
    </button>
  );
}
