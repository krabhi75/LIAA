import { createHash, randomBytes } from "crypto";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies } from "next/headers";
import { prisma } from "./db";
import { FAILURE_MESSAGE, GREETING, SALES_INSTRUCTIONS } from "./prompt";
import { mcpKey } from "./agora";

const COOKIE = "molvaani_session";
const TTL_DAYS = 14;

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
  orgId: string;
  orgSlug: string;
  orgName: string;
  role: string;
  plan: string;
};

function authSecret(): Uint8Array {
  const raw = process.env.AUTH_SECRET ?? "molvaani-dev-secret-change-me";
  return new TextEncoder().encode(raw);
}

export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, 10);
}

export async function verifyPassword(
  password: string,
  hash: string,
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48) || `org-${randomBytes(3).toString("hex")}`;
}

export async function createSessionToken(user: SessionUser): Promise<string> {
  return new SignJWT({ ...user })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(`${TTL_DAYS}d`)
    .sign(authSecret());
}

export async function readSessionToken(
  token: string,
): Promise<SessionUser | null> {
  try {
    const { payload } = await jwtVerify(token, authSecret());
    if (
      typeof payload.id !== "string" ||
      typeof payload.email !== "string" ||
      typeof payload.orgId !== "string"
    ) {
      return null;
    }
    return {
      id: payload.id,
      email: payload.email,
      name: typeof payload.name === "string" ? payload.name : null,
      orgId: payload.orgId,
      orgSlug: String(payload.orgSlug ?? ""),
      orgName: String(payload.orgName ?? ""),
      role: String(payload.role ?? "owner"),
      plan: String(payload.plan ?? "free"),
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(user: SessionUser): Promise<void> {
  const token = await createSessionToken(user);
  const jar = await cookies();
  jar.set(COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: TTL_DAYS * 24 * 60 * 60,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(COOKIE);
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const token = jar.get(COOKIE)?.value;
  if (!token) return null;
  return readSessionToken(token);
}

export async function requireSession(): Promise<SessionUser> {
  const session = await getSession();
  if (!session) throw new Error("UNAUTHORIZED");
  return session;
}

export async function provisionOrgForUser(opts: {
  userId: string;
  orgName: string;
  email: string;
}): Promise<{ orgId: string; orgSlug: string; agentId: string }> {
  let slug = slugify(opts.orgName);
  const collision = await prisma.organization.findUnique({ where: { slug } });
  if (collision) slug = `${slug}-${randomBytes(2).toString("hex")}`;

  const org = await prisma.organization.create({
    data: {
      name: opts.orgName,
      slug,
      plan: "free",
      memberships: {
        create: { userId: opts.userId, role: "owner" },
      },
      workspaces: {
        create: {
          name: "Default",
          agents: {
            create: {
              name: "Maya · Sales",
              slug: "maya",
              greeting: GREETING,
              systemPrompt: SALES_INSTRUCTIONS,
              failureMessage: FAILURE_MESSAGE,
              mcpKey: mcpKey(),
            },
          },
        },
      },
    },
    include: { workspaces: { include: { agents: true } } },
  });

  const agent = org.workspaces[0]?.agents[0];
  return { orgId: org.id, orgSlug: org.slug, agentId: agent?.id ?? "" };
}

export function planLimits(plan: string): {
  seats: number;
  minutes: number;
  agents: number;
} {
  switch (plan) {
    case "business":
      return { seats: 50, minutes: 5000, agents: 50 };
    case "pro":
      return { seats: 10, minutes: 1000, agents: 10 };
    default:
      return { seats: 3, minutes: 100, agents: 2 };
  }
}

export function fingerprintKey(raw: string): string {
  return createHash("sha256").update(raw).digest("hex").slice(0, 16);
}
