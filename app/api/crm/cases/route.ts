import { NextResponse } from "next/server";
import { listAgriCases } from "@/lib/agri-cases";

export async function GET() {
  return NextResponse.json({ cases: listAgriCases() });
}
