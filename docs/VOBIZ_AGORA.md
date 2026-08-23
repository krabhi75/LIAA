# Vobiz + Agora SIP (inbound & outbound)

Official guide: https://www.vobiz.ai/docs/integrations/agora

**Live trunks**

| Role | ID / domain |
|------|-------------|
| SIP domain (Agora SIP Trunk Address) | `a4dc1a99.sip.vobiz.ai` |
| Outbound trunk | `a4dc1a99-2efa-4f52-b481-5dfd99aca03d` |
| Inbound trunk | `c56b68cd-591f-4196-92df-e9e7a34aae9b` |
| SIP trunk ref | `5c206cbc-9733-48c5-a1d0-b7b50ecbe5e8` |

Agora → Add Phone Number → SIP Trunk Address = **`a4dc1a99.sip.vobiz.ai`**, UDP, plus the SIP **credential** username/password (not the trunk UUID).


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
