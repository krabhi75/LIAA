import { envPresent, publicBaseUrl } from "@/lib/agora";
import { vobizConfig } from "@/lib/vobiz";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const vobiz = vobizConfig();
  const databaseUrl = process.env.DATABASE_URL?.trim() ?? "";
  return NextResponse.json({
    ok: true,
    service: "liaa",
    publicBaseUrl: publicBaseUrl(req),
    env: {
      agoraAppId: envPresent("NEXT_PUBLIC_AGORA_APP_ID", "AGORA_APP_ID"),
      agoraCertificate: envPresent(
        "NEXT_AGORA_APP_CERTIFICATE",
        "AGORA_APP_CERTIFICATE",
      ),
      agoraArea: (process.env.AGORA_AREA ?? "US").toUpperCase(),
      mcpKeySet: envPresent("AETHER_MCP_KEY"),
      authSecretSet: envPresent("AUTH_SECRET"),
      databaseUrlSet: Boolean(databaseUrl),
      databaseLooksSqlite:
        databaseUrl.startsWith("file:") || databaseUrl.includes("dev.db"),
      vobizAuth: Boolean(vobiz.authId && vobiz.token),
      vobizFrom: Boolean(vobiz.from),
    },
  });
}

export async function POST() {
  return NextResponse.json({ ok: true });
}
