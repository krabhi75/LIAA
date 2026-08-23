import { NextResponse } from "next/server";
import {
  createAgriCase,
  escalateAgriCase,
  listAgriCases,
  setAgriCaseStatus,
} from "@/lib/agri-cases";

export const dynamic = "force-dynamic";
export const revalidate = 0;

function liveJson(body: unknown, status = 200) {
  return NextResponse.json(body, {
    status,
    headers: {
      "Cache-Control": "no-store, no-cache, must-revalidate, max-age=0",
    },
  });
}

export async function GET() {
  return liveJson({ cases: await listAgriCases(), at: new Date().toISOString() });
}

export async function POST(req: Request) {
  const body = (await req.json()) as {
    farmerName?: string;
    phone?: string;
    crop?: string;
    village?: string;
    district?: string;
    symptoms?: string;
    summary?: string;
  };
  if (!body.farmerName && !body.symptoms && !body.phone) {
    return NextResponse.json(
      { error: "farmer name, phone, or symptoms required" },
      { status: 400 },
    );
  }
  const created = await createAgriCase({
    farmerName: body.farmerName || "Farmer",
    phone: body.phone || "",
    crop: body.crop || "",
    village: body.village || "",
    district: body.district || "",
    symptoms: body.symptoms || "",
    started: "",
    watering: "",
    summary: body.summary || body.symptoms || "",
    channel: `crm-${Date.now()}`,
    transcript: "",
    direction: "desk",
    source: "crm-ui",
  });
  return NextResponse.json({ case: created });
}

export async function PATCH(req: Request) {
  const body = (await req.json()) as {
    id?: string;
    status?: "open" | "escalated" | "closed";
    reason?: string;
  };
  if (!body.id) {
    return NextResponse.json({ error: "id required" }, { status: 400 });
  }
  const status = body.status ?? (body.reason ? "escalated" : undefined);
  if (!status) {
    return NextResponse.json({ error: "status required" }, { status: 400 });
  }
  switch (status) {
    case "escalated": {
      const row = await escalateAgriCase(body.id, body.reason || "Expert desk");
      if (!row) return NextResponse.json({ error: "case not found" }, { status: 404 });
      return NextResponse.json({ case: row });
    }
    case "open":
    case "closed": {
      const row = await setAgriCaseStatus(body.id, status);
      if (!row) return NextResponse.json({ error: "case not found" }, { status: 404 });
      return NextResponse.json({ case: row });
    }
    default: {
      const _exhaustive: never = status;
      return NextResponse.json({ error: String(_exhaustive) }, { status: 400 });
    }
  }
}
