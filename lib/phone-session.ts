export type PhoneStage = "name" | "place" | "help";

export type PhoneConv = {
  stage: PhoneStage;
  name: string;
  place: string;
  weather: string;
};

export function freshPhoneConv(): PhoneConv {
  return { stage: "name", name: "", place: "", weather: "" };
}

export function phoneConvFromParams(
  params: Record<string, string>,
): PhoneConv {
  const stage = params.stage || params.s || "name";
  const valid: PhoneStage =
    stage === "place" || stage === "help" ? stage : "name";
  return {
    stage: valid,
    name: params.name || params.n || "",
    place: params.place || params.p || "",
    weather: params.weather || params.w || "",
  };
}

/** Persist dialog state in Gather action URLs (serverless-safe). */
export function gatherActionWithState(
  baseGatherUrl: string,
  conv: PhoneConv,
): string {
  const u = new URL(baseGatherUrl);
  u.searchParams.set("stage", conv.stage);
  if (conv.name) u.searchParams.set("name", conv.name);
  if (conv.place) u.searchParams.set("place", conv.place);
  if (conv.weather) u.searchParams.set("weather", conv.weather);
  return u.toString();
}

export function gatherRetryUrl(actionUrl: string): string {
  const u = new URL(actionUrl);
  u.searchParams.set("retry", "1");
  return u.toString();
}

export function retryPromptForStage(stage: PhoneStage, name: string): string {
  if (stage === "place") {
    return name
      ? `${name} ji, aap kis city ya district mein hain?`
      : "Aap kis city ya district mein hain?";
  }
  if (stage === "help") {
    return name
      ? `${name} ji, kheti mein kis cheez mein madad chahiye?`
      : "Kheti mein kis cheez mein madad chahiye?";
  }
  return "Sunai nahi aayi. Sirf apna naam boliye.";
}
