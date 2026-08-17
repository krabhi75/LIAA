import { NextRequest, NextResponse } from "next/server";
import { getSession } from "@/lib/auth";

/** Stripe Checkout stub — wire STRIPE_SECRET_KEY + price IDs for production. */
export async function POST(req: NextRequest) {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { plan } = (await req.json().catch(() => ({}))) as { plan?: string };
  const target = plan === "business" ? "business" : "pro";

  if (!process.env.STRIPE_SECRET_KEY) {
    return NextResponse.json({
      ok: true,
      mode: "stub",
      message: `Stripe not configured. In production this upgrades org ${session.orgSlug} to ${target}.`,
      checkoutUrl: null,
    });
  }

  return NextResponse.json({
    ok: false,
    error: "Stripe price IDs not configured yet",
  });
}
