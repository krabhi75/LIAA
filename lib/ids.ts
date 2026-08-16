export const CUSTOMER_UID = 1002;
export const AGENT_UID = "123456";
export const HUMAN_UID = 2002;

export function newChannelName(): string {
  return `aether-${Date.now().toString(36)}`;
}
