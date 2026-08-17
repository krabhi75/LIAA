import { redirect } from "next/navigation";
import { getSession, planLimits } from "@/lib/auth";
import { SaasShell } from "@/components/saas/SaasShell";
import { prisma } from "@/lib/db";
import { BillingActions } from "@/components/saas/BillingActions";

export default async function BillingPage() {
  const session = await getSession();
  if (!session) redirect("/login");

  const limits = planLimits(session.plan);
  const starts = await prisma.usageEvent.count({
    where: {
      orgId: session.orgId,
      kind: "session_start",
      createdAt: { gte: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000) },
    },
  });

  return (
    <SaasShell
      user={session}
      title="Billing"
      subtitle="Seat + Conversational AI minute plans"
    >
      <div className="grid gap-4 md:grid-cols-3">
        <div className="border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase text-slate-500">Current plan</div>
          <div className="mt-2 text-2xl font-semibold capitalize">
            {session.plan}
          </div>
        </div>
        <div className="border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase text-slate-500">Session starts</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">
            {starts}{" "}
            <span className="text-sm font-normal text-slate-500">
              / {limits.minutes} min pool
            </span>
          </div>
        </div>
        <div className="border border-slate-200 bg-white p-4">
          <div className="text-xs uppercase text-slate-500">Agent seats</div>
          <div className="mt-2 text-2xl font-semibold tabular-nums">
            up to {limits.agents}
          </div>
        </div>
      </div>

      <div className="mt-8 border border-slate-200 bg-white p-6">
        <h2 className="text-sm font-semibold text-slate-900">Upgrade</h2>
        <p className="mt-2 text-sm text-slate-600">
          Free · Pro · Business. Stripe Checkout wires when{" "}
          <code className="text-xs">STRIPE_SECRET_KEY</code> is set.
        </p>
        <BillingActions />
      </div>
    </SaasShell>
  );
}
