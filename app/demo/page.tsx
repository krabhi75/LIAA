"use client";

import { MolVaaniDesk } from "@/components/desk/MolVaaniDesk";
import { useClientChannel } from "@/hooks/useClientChannel";

export default function DemoDeskPage() {
  const channel = useClientChannel();

  if (!channel) {
    return (
      <div className="grid min-h-screen place-items-center text-sm text-slate-500">
        Opening the revenue desk…
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      <MolVaaniDesk channel={channel} />
    </div>
  );
}
