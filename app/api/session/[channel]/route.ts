import { NextRequest, NextResponse } from "next/server";
import { snapshot } from "@/lib/store";
import { PLANS, upcomingSlots } from "@/lib/catalog";

export async function GET(
  _req: NextRequest,
  context: { params: Promise<{ channel: string }> },
) {
  const { channel } = await context.params;
  const session = snapshot(channel);
  return NextResponse.json({
    ...session,
    catalog: PLANS,
    slots: upcomingSlots(6),
  });
}
