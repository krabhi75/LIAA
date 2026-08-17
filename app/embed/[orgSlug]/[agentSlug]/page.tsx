"use client";

import { useEffect, useState } from "react";
import { MolVaaniDesk } from "@/components/desk/MolVaaniDesk";
import { useClientChannel } from "@/hooks/useClientChannel";

export default function EmbedPage({
  params,
}: {
  params: Promise<{ orgSlug: string; agentSlug: string }>;
}) {
  const channel = useClientChannel();
  const [agentConfigId, setAgentConfigId] = useState<string | null>(null);
  const [label, setLabel] = useState("Loading…");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void params.then(async ({ orgSlug, agentSlug }) => {
      setLabel(`${orgSlug}/${agentSlug}`);
      const res = await fetch(
        `/api/public/embed/${encodeURIComponent(orgSlug)}/${encodeURIComponent(agentSlug)}`,
      );
      if (!res.ok) {
        setError("Agent not found");
        return;
      }
      const data = await res.json();
      setAgentConfigId(data.agentConfigId);
      setLabel(`${data.orgName} · ${data.agentName}`);
    });
  }, [params]);

  if (error) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-red-600">
        {error}
      </div>
    );
  }

  if (!channel || !agentConfigId) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-slate-500">
        Loading embed…
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      <div className="border-b border-slate-200 bg-white px-4 py-2 text-xs text-slate-500">
        Embed · {label} · Agora voice widget
      </div>
      <div className="h-[calc(100vh-33px)]">
        <MolVaaniDesk channel={channel} agentConfigId={agentConfigId} />
      </div>
    </div>
  );
}
