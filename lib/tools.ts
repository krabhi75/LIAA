import {
  COMPETITORS,
  PLANS,
  PRODUCT,
  monthlyTotal,
  recommendPlan,
  upcomingSlots,
} from "./catalog";
import {
  bookMeeting,
  escalate,
  recordTool,
  snapshot,
  upsertLead,
  type ObjectionType,
} from "./store";

export const TOOL_NAMES = [
  "get_pricing",
  "compare_competitor",
  "get_availability",
  "upsert_crm_lead",
  "book_demo",
  "escalate_to_human",
  "get_lead",
] as const;

export type ToolName = (typeof TOOL_NAMES)[number];

export const TOOL_DEFS = [
  {
    name: "get_pricing",
    description:
      "Retrieve Nimbus list pricing and a recommended plan for a seat count. Always call before quoting a number.",
    inputSchema: {
      type: "object",
      properties: {
        seats: { type: "number", description: "Expected number of users" },
        plan_id: {
          type: "string",
          enum: ["starter", "growth", "enterprise"],
        },
      },
    },
  },
  {
    name: "compare_competitor",
    description:
      "Retrieve a fair comparison vs Slack, Teams, Asana, or Notion. Call when the customer names a competitor.",
    inputSchema: {
      type: "object",
      properties: {
        competitor: { type: "string" },
      },
      required: ["competitor"],
    },
  },
  {
    name: "get_availability",
    description: "Retrieve upcoming live demo slots in IST.",
    inputSchema: { type: "object", properties: {} },
  },
  {
    name: "upsert_crm_lead",
    description:
      "Create or update the CRM lead for this call. Call whenever name, company, seats, competitor, or status changes.",
    inputSchema: {
      type: "object",
      properties: {
        name: { type: "string" },
        company: { type: "string" },
        role: { type: "string" },
        email: { type: "string" },
        seats: { type: "number" },
        plan_id: { type: "string" },
        competitor: { type: "string" },
        timeline: { type: "string" },
        objection: {
          type: "string",
          enum: ["pricing", "trust", "product"],
        },
        status: {
          type: "string",
          enum: ["qualifying", "qualified", "follow_up"],
        },
        notes: { type: "string" },
      },
    },
  },
  {
    name: "book_demo",
    description: "Book a demo on the calendar and mark the CRM lead demo_booked.",
    inputSchema: {
      type: "object",
      properties: {
        slot_id: { type: "string" },
        attendee: { type: "string" },
      },
    },
  },
  {
    name: "escalate_to_human",
    description:
      "Hand the live call to a human specialist with conversation context. Use for enterprise legal, custom MSA, anger, or low confidence.",
    inputSchema: {
      type: "object",
      properties: {
        reason: { type: "string" },
        summary: { type: "string" },
      },
      required: ["reason", "summary"],
    },
  },
  {
    name: "get_lead",
    description: "Read the CRM record for this call, including earlier details.",
    inputSchema: { type: "object", properties: {} },
  },
];

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" ? (value as Record<string, unknown>) : {};
}

export function runTool(
  channel: string,
  name: string,
  rawArgs: unknown,
): unknown {
  const args = asRecord(rawArgs);
  let output: unknown;

  switch (name) {
    case "get_pricing": {
      const seats = Number(args.seats ?? 25);
      const plan =
        PLANS.find((p) => p.id === args.plan_id) ?? recommendPlan(seats);
      const total = monthlyTotal(plan, seats);
      output = {
        product: PRODUCT.name,
        seats,
        recommended_plan: plan.name,
        plan_id: plan.id,
        list_price_per_user_usd: plan.pricePerUserUsd,
        estimated_monthly_usd: total,
        sla: plan.sla,
        highlights: plan.highlights,
        note:
          plan.id === "enterprise"
            ? "Enterprise is custom. Quote a floor of $18/user/month and move to a live demonstration."
            : "List price. Do not invent a deeper discount than 15% without escalating.",
      };
      break;
    }
    case "compare_competitor": {
      const key = String(args.competitor ?? "")
        .toLowerCase()
        .replace(/[^a-z]/g, "");
      const match =
        COMPETITORS[key] ??
        Object.values(COMPETITORS).find((c) =>
          key.includes(c.name.toLowerCase().replace(/[^a-z]/g, "")),
        );
      output = match
        ? {
            competitor: match.name,
            when_nimbus_wins: match.whenWeWin,
            when_they_win: match.whenTheyWin,
          }
        : {
            competitor: args.competitor,
            when_nimbus_wins:
              "Stay factual. Nimbus is a work OS with guest rooms and SSO. Ask what they liked about the other tool.",
            when_they_win:
              "If they already standardized on that stack, do not force a rip-and-replace.",
          };
      break;
    }
    case "get_availability": {
      output = { timezone: "Asia/Kolkata", slots: upcomingSlots(6) };
      break;
    }
    case "upsert_crm_lead": {
      output = upsertLead(channel, {
        name: args.name as string | undefined,
        company: args.company as string | undefined,
        role: args.role as string | undefined,
        email: args.email as string | undefined,
        seats: typeof args.seats === "number" ? args.seats : undefined,
        planId: args.plan_id as LeadPlan | undefined,
        competitor: args.competitor as string | undefined,
        timeline: args.timeline as string | undefined,
        objection: args.objection as ObjectionType | undefined,
        status: args.status as "qualifying" | "qualified" | "follow_up" | undefined,
        notesAppend: args.notes as string | undefined,
      });
      break;
    }
    case "book_demo": {
      output = bookMeeting(
        channel,
        String(args.slot_id ?? ""),
        args.attendee as string | undefined,
      );
      break;
    }
    case "escalate_to_human": {
      output = escalate(
        channel,
        String(args.reason ?? "unspecified"),
        String(args.summary ?? ""),
      );
      break;
    }
    case "get_lead": {
      output = snapshot(channel).lead;
      break;
    }
    default:
      output = { error: `Unknown tool ${name}` };
  }

  recordTool(channel, name, args, output);
  return output;
}

type LeadPlan = "starter" | "growth" | "enterprise";
