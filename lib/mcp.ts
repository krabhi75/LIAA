import { TOOL_DEFS, TOOL_NAMES, runTool } from "./tools";

type JsonRpc = {
  jsonrpc?: string;
  id?: string | number | null;
  method?: string;
  params?: unknown;
};

function ok(id: JsonRpc["id"], result: unknown) {
  return { jsonrpc: "2.0", id: id ?? null, result };
}

function err(id: JsonRpc["id"], code: number, message: string) {
  return { jsonrpc: "2.0", id: id ?? null, error: { code, message } };
}

export function handleMcp(body: JsonRpc, channel: string): unknown {
  const method = body.method ?? "";
  const id = body.id ?? null;

  if (method === "initialize") {
    return ok(id, {
      protocolVersion: "2024-11-05",
      capabilities: { tools: {} },
      serverInfo: { name: "aetherclose", version: "0.1.0" },
    });
  }

  if (method === "notifications/initialized" || method === "initialized") {
    return ok(id, {});
  }

  if (method === "ping") {
    return ok(id, {});
  }

  if (method === "tools/list") {
    return ok(id, { tools: TOOL_DEFS });
  }

  if (method === "tools/call") {
    const params = (body.params ?? {}) as {
      name?: string;
      arguments?: unknown;
    };
    const name = params.name ?? "";
    if (!TOOL_NAMES.includes(name as (typeof TOOL_NAMES)[number])) {
      return err(id, -32601, `Unknown tool ${name}`);
    }
    const result = runTool(channel, name, params.arguments ?? {});
    return ok(id, {
      content: [{ type: "text", text: JSON.stringify(result) }],
      structuredContent: result,
    });
  }

  if (!method) {
    return err(id, -32600, "Missing method");
  }
  return err(id, -32601, `Unknown method ${method}`);
}
