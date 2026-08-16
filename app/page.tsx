"use client";

import { MolVaaniDesk } from "@/components/desk/MolVaaniDesk";
import { useClientChannel } from "@/hooks/useClientChannel";

export default function Home() {
  const channel = useClientChannel();

  if (!channel) {
    return (
      <div className="grid min-h-full place-items-center text-sm text-slate-500">
        Opening the revenue desk…
      </div>
    );
  }

  return <MolVaaniDesk channel={channel} />;
}
