import {
  PLANS,
  monthlyTotal,
  recommendPlan,
} from "./catalog";

const INR_PER_USD = 83.5;

export type LeadLike = {
  company?: string;
  name?: string;
  seats?: number;
  planId?: string;
  competitor?: string;
  objections?: string[];
  status?: string;
};

export type ToolLike = { tool: string };

export function planForLead(lead?: LeadLike | null) {
  if (!lead) return null;
  const seats = lead.seats ?? 0;
  if (lead.planId) {
    const named = PLANS.find((p) => p.id === lead.planId);
    if (named) return named;
  }
  if (seats > 0) return recommendPlan(seats);
  return null;
}

export function dealEconomics(lead?: LeadLike | null) {
  const plan = planForLead(lead);
  const seats = lead?.seats ?? 0;
  const monthlyUsd = plan && seats > 0 ? monthlyTotal(plan, seats) ?? 0 : 0;
  const arrUsd = monthlyUsd * 12;
  return {
    plan,
    seats,
    monthlyUsd,
    arrUsd,
    monthlyInr: monthlyUsd * INR_PER_USD,
    arrInr: arrUsd * INR_PER_USD,
  };
}

export function winProbability(
  lead?: LeadLike | null,
  tools: ToolLike[] = [],
  turnCount = 0,
): number {
  let p = 18;
  if (lead?.company) p += 8;
  if (lead?.name) p += 4;
  if (lead?.seats) p += 10;
  if (lead?.planId) p += 8;
  if (lead?.competitor) p += 7;
  if (lead?.objections?.length) {
    p += Math.min(lead.objections.length * 5, 12);
  }
  if (lead?.status === "qualifying") p += 6;
  if (lead?.status === "qualified") p += 16;
  if (lead?.status === "follow_up") p += 10;
  if (lead?.status === "demo_booked") p = Math.max(p + 22, 79);
  if (lead?.status === "escalated") p += 8;
  if (tools.some((t) => t.tool === "get_pricing")) p += 4;
  if (tools.some((t) => t.tool === "compare_competitor")) p += 5;
  if (tools.some((t) => t.tool === "book_demo")) p += 10;
  p += Math.min(turnCount * 1.2, 8);
  return Math.max(8, Math.min(94, Math.round(p)));
}

export function formatUsd(n: number, digits = 0): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: digits,
    minimumFractionDigits: digits,
  }).format(n);
}

export function formatInr(n: number): string {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n);
}

export function formatDuration(ms: number): string {
  const total = Math.max(0, Math.floor(ms / 1000));
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  const pad = (v: number) => String(v).padStart(2, "0");
  return h > 0 ? `${h}:${pad(m)}:${pad(s)}` : `${pad(m)}:${pad(s)}`;
}

export function formatIst(date: Date): string {
  return date.toLocaleTimeString("en-IN", {
    timeZone: "Asia/Kolkata",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  });
}

export function stageLabel(status?: string): string {
  switch (status) {
    case "qualifying":
      return "Qualifying";
    case "qualified":
      return "Qualified";
    case "demo_booked":
      return "Demo booked";
    case "escalated":
      return "Human desk";
    case "follow_up":
      return "Follow-up";
    case "new":
      return "New conversation";
    default:
      return "In conversation";
  }
}

export function stageIndex(status?: string): number {
  const order = [
    "new",
    "qualifying",
    "qualified",
    "demo_booked",
    "escalated",
    "follow_up",
  ];
  const i = order.indexOf(status ?? "new");
  return i < 0 ? 0 : Math.min(i, 3);
}

