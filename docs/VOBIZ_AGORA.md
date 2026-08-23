# Vobiz + Agora SIP (inbound & outbound)

Official guide: https://www.vobiz.ai/docs/integrations/agora

**Number:** `+917971443138` (Gujarat). This is SIP, not the old XML Speak/Gather IVR.

Unlink the XML voice app **test** from this number after the inbound trunk is linked, or inbound may never reach Agora.

## India SBC (inbound)

Origination URI in Vobiz (no `sip:` prefix):

`sbc-ap-south.viblinx.com`

Transport: **UDP** · port 5060 if asked.

## Outbound (Agora → Vobiz → phone)

1. Vobiz → [Credentials](https://console.vobiz.ai/app/sip/out/credentials) → Add Credential. Save username + password once.
2. Vobiz → [Outbound trunks](https://console.vobiz.ai/app/sip/out/trunks) → create trunk, attach credential. Copy **SIP Domain** (`xxxx.sip.vobiz.ai`).
3. Agora Console → Add Phone Number → Vendor **SIP Trunk**:
   - Phone: `+917971443138`
   - SIP Trunk Address: that domain
   - Transport: UDP
   - Username / password: the credential
4. Agora → **Agents** → create agent, paste Liaa prompt from `/telephony`.
5. Agora → **Campaigns** → create campaign (agent + this number + one contact) for outbound.

## Inbound (farmer dials your number → Agora)

1. Vobiz → [Origination URIs](https://console.vobiz.ai/app/sip/in/uri) → URI `sbc-ap-south.viblinx.com` · UDP · Active.
2. Vobiz → [Inbound trunks](https://console.vobiz.ai/app/sip/in/trunks) → Primary URI = that origination. **Link Numbers** → `+917971443138`.
3. Optional hangup webhook: `https://YOUR_PUBLIC_BASE/api/vobiz/hangup` (POST) so CRM disposition updates.
4. Agora → edit phone number → **Inbound Settings** → Inbound agent = Liaa agent. Keep end-on-silence on.

## Test

- Inbound: call `+917971443138` from a mobile.
- Outbound: Agora campaign with your own mobile as the contact.
- Vobiz [Call logs](https://console.vobiz.ai/app/sip/logs).

## If 401/403 outbound

Credential not on the trunk, or Agora username/password mismatch.

## If inbound rings but no agent

Number not linked on inbound trunk, or Agora inbound agent still **Unassigned**. Wrong region SBC (must be AP South for +91).
