"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { MolVaaniDesk } from "@/components/desk/MolVaaniDesk";
import { useClientChannel } from "@/hooks/useClientChannel";

export default function AppLivePage() {
  const channel = useClientChannel();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    fetch("/api/auth/me").then((r) => {
      if (!r.ok) {
        router.replace("/login");
        return;
      }
      setReady(true);
    });
  }, [router]);

  if (!ready || !channel) {
    return (
      <div className="nova-gate">
        <div className="nova-gate__mark">MOLVAANI</div>
        <p className="nova-label">opening authenticated desk</p>
      </div>
    );
  }

  return (
    <div className="h-screen overflow-hidden">
      <MolVaaniDesk channel={channel} />
    </div>
  );
}
