import { NextResponse } from "next/server";
import { parseVobizBody } from "@/lib/vobiz";
import { findCallByUuid, updateCall } from "@/lib/crm-store";

export const dynamic = "force-dynamic";

/** Vobiz RecordStop callback — stores playable recording URL on the CRM call. */
export async function POST(req: Request) {
  try {
    const params = await parseVobizBody(req);
    const uuid = params.CallUUID || params.RequestUUID || "";
    const url =
      params.RecordUrl ||
      params.RecordFile ||
      params.record_url ||
      params.RecordingUrl ||
      "";
    const recordingId = params.RecordingID || params.recording_id || "";
    const secs = Number(
      params.RecordingDuration || params.recording_duration || "0",
    );
    if (uuid && url) {
      const call = await findCallByUuid(uuid);
      if (call) {
        await updateCall(call.id, {
          recordingUrl: url,
          recordingId,
          recordingSecs: Number.isFinite(secs) ? secs : 0,
        });
      }
    }
    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[vobiz/recording]", err);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}

export async function GET() {
  return NextResponse.json({
    ok: true,
    hint: "POST RecordStop callbacks from Vobiz Record here",
  });
}
