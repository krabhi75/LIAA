/** Client-safe phone formatting — no Node/fs imports. */

export function formatPhoneForDisplay(phone: string): string {
  const digits = phone.replace(/\D/g, "");
  if (/^99999999\d{2}$/.test(digits)) {
    return `9999-9999-${digits.slice(-2)}`;
  }
  return phone;
}

export function looksLikePhone(value: string): boolean {
  const digits = value.replace(/\D/g, "");
  return digits.length >= 8 && /^[\d\s+\-().]+$/.test(value.trim());
}

/** Never show raw digits in dashboard tiles — use farmer name or call type. */
export function lastActivityHint(
  call: {
    phone?: string;
    direction?: string;
    contact?: { name?: string | null } | null;
  },
  contacts?: { name: string; phone: string }[],
): string {
  const name = call.contact?.name?.trim();
  if (name && !looksLikePhone(name)) return name;

  const phone = (call.phone || "").replace(/\D/g, "");
  if (contacts?.length && phone) {
    const match = contacts.find((c) => {
      const cp = c.phone.replace(/\D/g, "");
      return cp === phone || cp.endsWith(phone) || phone.endsWith(cp);
    });
    if (match?.name && !looksLikePhone(match.name)) return match.name;
  }

  const dir = (call.direction || "").toLowerCase();
  if (dir.includes("in")) return "Inbound call";
  if (dir.includes("out")) return "Outbound call";
  return "Recent call";
}
