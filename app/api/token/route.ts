import { NextRequest, NextResponse } from "next/server";
import { RtcRole, RtcTokenBuilder, RtmTokenBuilder } from "agora-token";
import { appCertificate, appId } from "@/lib/agora";

const TOKEN_TTL_SECONDS = 60 * 60;

export async function POST(req: NextRequest) {
  try {
    const { channel, uid } = await req.json();
    if (!channel || typeof uid !== "number") {
      return NextResponse.json(
        { error: "channel and numeric uid required" },
        { status: 400 },
      );
    }

    const rtcToken = RtcTokenBuilder.buildTokenWithUid(
      appId(),
      appCertificate(),
      channel,
      uid,
      RtcRole.PUBLISHER,
      TOKEN_TTL_SECONDS,
      TOKEN_TTL_SECONDS,
    );
    const rtmToken = RtmTokenBuilder.buildToken(
      appId(),
      appCertificate(),
      String(uid),
      TOKEN_TTL_SECONDS,
    );

    return NextResponse.json({
      rtcToken,
      rtmToken,
      expireAt: Math.floor(Date.now() / 1000) + TOKEN_TTL_SECONDS,
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
