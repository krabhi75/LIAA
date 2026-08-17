import { NextRequest, NextResponse } from "next/server";
import { hydrateSession } from "@/lib/store";
import { PLANS, upcomingSlots } from "@/lib/catalog";
import { dealEconomics, winProbability } from "@/lib/metrics";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ channel: string }> },
) {
  const { channel } = await context.params;
  const session = await hydrateSession(channel);
  const economics = dealEconomics(session.lead);
  return NextResponse.json({
    ...session,
    catalog: PLANS,
    slots: upcomingSlots(6),
    economics,
    winProbability: winProbability(session.lead, session.tools),
    serverTime: new Date().toISOString(),
  });
}
