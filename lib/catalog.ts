export type PlanId = "starter" | "growth" | "enterprise";

export type Plan = {
  id: PlanId;
  name: string;
  pricePerUserUsd: number | "custom";
  minSeats: number;
  maxSeats: number | null;
  sla: string;
  highlights: string[];
};

export const PRODUCT = {
  name: "Nimbus Workspace",
  category: "team collaboration and work OS",
  oneLiner:
    "Nimbus is a work OS for growing teams: docs, tasks, and customer rooms in one place, with SSO and an audit trail.",
} as const;

export const PLANS: Plan[] = [
  {
    id: "starter",
    name: "Starter",
    pricePerUserUsd: 12,
    minSeats: 3,
    maxSeats: 20,
    sla: "email, next business day",
    highlights: ["Unlimited docs", "Basic task boards", "2 integrations"],
  },
  {
    id: "growth",
    name: "Growth",
    pricePerUserUsd: 28,
    minSeats: 10,
    maxSeats: 200,
    sla: "chat + email, 8-hour response",
    highlights: [
      "SSO (Google / Microsoft)",
      "API access",
      "Guest client rooms",
      "Unlimited integrations",
    ],
  },
  {
    id: "enterprise",
    name: "Enterprise",
    pricePerUserUsd: "custom",
    minSeats: 50,
    maxSeats: null,
    sla: "named CSM, 99.9% uptime, 1-hour P1",
    highlights: [
      "SAML / SCIM",
      "EU or India data residency",
      "Security review pack",
      "On-site enablement",
      "Custom MSA",
    ],
  },
];

export const COMPETITORS: Record<
  string,
  { name: string; whenWeWin: string; whenTheyWin: string }
> = {
  slack: {
    name: "Slack",
    whenWeWin:
      "Nimbus keeps work next to the conversation. Slack is chat-first; teams still bounce to a doc tool and a task tool.",
    whenTheyWin:
      "If they only need real-time chat with no work objects, Slack is simpler.",
  },
  teams: {
    name: "Microsoft Teams",
    whenWeWin:
      "Teams is strong if they already live in Microsoft 365. Nimbus is lighter to roll out for mixed-tool companies and has a clearer guest-client room.",
    whenTheyWin:
      "If procurement already standardized on Microsoft, Teams plus Planner may be enough.",
  },
  asana: {
    name: "Asana",
    whenWeWin:
      "Asana is task-strong. Nimbus is better when the buying team also needs client-facing rooms and a single search across docs and work.",
    whenTheyWin:
      "If they only want project tracking and already have a chat tool they love, Asana can be narrower and cheaper.",
  },
  notion: {
    name: "Notion",
    whenWeWin:
      "Notion is a flexible wiki. Nimbus is opinionated for pipeline, SLA, and guest access that security teams will sign off.",
    whenTheyWin:
      "If the team wants a blank canvas wiki, Notion is more flexible.",
  },
};

export function recommendPlan(seats: number): Plan {
  if (seats <= 20) return PLANS[0];
  if (seats <= 200) return PLANS[1];
  return PLANS[2];
}

export function monthlyTotal(plan: Plan, seats: number): number | null {
  if (plan.pricePerUserUsd === "custom") {
    const floor = Math.max(seats, plan.minSeats) * 18;
    return floor;
  }
  return plan.pricePerUserUsd * Math.max(seats, plan.minSeats);
}

export function upcomingSlots(count = 6): { id: string; label: string; iso: string }[] {
  const out: { id: string; label: string; iso: string }[] = [];
  const hours = [11, 16];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  let day = 1;
  while (out.length < count && day < 14) {
    const d = new Date(cursor);
    d.setDate(d.getDate() + day);
    const dow = d.getDay();
    if (dow !== 0 && dow !== 6) {
      for (const h of hours) {
        if (out.length >= count) break;
        const slot = new Date(d);
        slot.setHours(h, 0, 0, 0);
        out.push({
          id: `slot-${slot.getTime()}`,
          label: slot.toLocaleString("en-IN", {
            weekday: "short",
            day: "numeric",
            month: "short",
            hour: "numeric",
            minute: "2-digit",
            timeZone: "Asia/Kolkata",
          }) + " IST",
          iso: slot.toISOString(),
        });
      }
    }
    day += 1;
  }
  return out;
}
