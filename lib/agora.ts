import { AgoraClient, Area, type AgoraArea } from "agora-agents";

const AREA_MAP: Record<string, AgoraArea> = {
  US: Area.US,
  EU: Area.EU,
  AP: Area.AP,
  CN: Area.CN,
};

function firstNonEmpty(...keys: string[]): string {
  for (const key of keys) {
    const value = process.env[key]?.trim();
    if (value) return value;
  }
  return "";
}

export function envPresent(...keys: string[]): boolean {
  return Boolean(firstNonEmpty(...keys));
}

export function appId(): string {
  const value = firstNonEmpty("NEXT_PUBLIC_AGORA_APP_ID", "AGORA_APP_ID");
  if (!value) {
    throw new Error(
      "Agora App ID is missing. Set NEXT_PUBLIC_AGORA_APP_ID (or AGORA_APP_ID) on the host and redeploy.",
    );
  }
  return value;
}

export function appCertificate(): string {
  const value = firstNonEmpty(
    "NEXT_AGORA_APP_CERTIFICATE",
    "AGORA_APP_CERTIFICATE",
  );
  if (!value) {
    throw new Error(
      "Agora App Certificate is missing. Set NEXT_AGORA_APP_CERTIFICATE (or AGORA_APP_CERTIFICATE) on the host and redeploy.",
    );
  }
  return value;
}

export function agoraArea(): AgoraArea {
  const key = (process.env.AGORA_AREA ?? "US").toUpperCase();
  return AREA_MAP[key] ?? Area.US;
}

export function agoraClient(): AgoraClient {
  return new AgoraClient({
    area: agoraArea(),
    appId: appId(),
    appCertificate: appCertificate(),
  });
}

export function publicBaseUrl(req?: Request): string | null {
  const configured = firstNonEmpty("PUBLIC_BASE_URL").replace(/\/$/, "");
  if (configured) return configured;
  const prod = process.env.VERCEL_PROJECT_PRODUCTION_URL?.replace(/\/$/, "");
  if (prod) return prod.startsWith("http") ? prod : `https://${prod}`;
  const deploy = process.env.VERCEL_URL?.replace(/\/$/, "");
  if (deploy) return `https://${deploy}`;
  if (!req) return null;
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  if (!host) return null;
  return `${proto}://${host}`;
}

/** Always a public HTTPS origin for Vobiz Answer/Gather callbacks. */
export function voicePublicBase(req?: Request): string {
  return (
    publicBaseUrl(req)?.replace(/\/$/, "") || "https://liaa-ebon.vercel.app"
  );
}

export function mcpKey(): string {
  return process.env.AETHER_MCP_KEY ?? "change-me-before-demo";
}
