"use client";

import { MolVaaniDesk } from "@/components/desk/MolVaaniDesk";
import { useClientChannel } from "@/hooks/useClientChannel";

export default function AppLivePage() {
  const channel = useClientChannel();

  if (!channel) {
    return (
      <div className="nova-gate">
        <div className="nova-gate__mark">MOLVAANI</div>
        <p className="nova-label">opening desk</p>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      <MolVaaniDesk channel={channel} />
    </div>
  );
}
