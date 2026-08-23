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

## Inbound in detail (farmer dials you → Liaa answers)

Outbound (CSV campaign) is Agora **calling out**. Inbound is the opposite: someone dials **+917971443138**, Vobiz receives the PSTN call, then **sends SIP to Agora’s India SBC**, and Agora’s **inbound agent** talks.

```text
Farmer phone → Vobiz DID +917971443138
            → Inbound trunk (c56b68cd-591f-4196-92df-e9e7a34aae9b)
            → Origination URI sbc-ap-south.viblinx.com
            → Agora Conversational AI agent (must not be Unassigned)
            → Liaa speaks
```

Do **not** leave Voice App **test** (XML) linked to this number. XML and SIP inbound fight; XML usually wins and Agora never hears the call.

### Step A — Origination URI (where Vobiz should send the call)

1. Open [https://console.vobiz.ai/app/sip/in/uri](https://console.vobiz.ai/app/sip/in/uri).
2. Click **Add** / **Create origination URI**.
3. Fill:
   - **URI:** `sbc-ap-south.viblinx.com`  
     Paste **without** `sip:`. Wrong: `sip:sbc-ap-south.viblinx.com:5060`. Right: `sbc-ap-south.viblinx.com` (add `:5060` only if the form has a separate port field).
   - **Description:** `Agora India SBC`
   - **Transport:** **UDP** (same as Agora phone number).
   - **Active:** On.
4. Save. You now have a named destination = Agora’s Asia-Pacific / India SBC. +91 numbers must use this region, not the US SBC.

### Step B — Inbound trunk (the pipe that uses that URI)

1. Open [https://console.vobiz.ai/app/sip/in/trunks](https://console.vobiz.ai/app/sip/in/trunks).
2. Open trunk **`c56b68cd-591f-4196-92df-e9e7a34aae9b`** (or create one if that ID is missing).
3. Set **Primary URI** to the origination URI from Step A.
4. Status **Enabled**.
5. Optional: Hangup / status webhook `POST` to `https://YOUR_PUBLIC_HTTPS/api/vobiz/hangup` (Cloudflare tunnel or Vercel). This only updates CRM; it is not required for Liaa to talk.

### Step C — Link the Gujarat number to that inbound trunk

1. On the same inbound trunk, click **Link Numbers**.
2. Select **+917971443138**. Confirm. Linked count should be **1**.
3. Go to **Setup → Numbers → My number**.
4. Open **+917971443138**.
5. **Voice app** should **not** stay on **test**. Unlink / set to none / SIP trunk so inbound uses the trunk, not XML.

If the number stays on XML app **test**, Vobiz will hit your old answer URL instead of Agora.

### Step D — Agora inbound agent (who answers)

1. Agora Console → the same phone number you already use for CSV outbound (`+917971443138`, display name Liaatesting).
2. Open **Edit phone number**.
3. **Inbound Settings → Inbound agent:** choose the **Liaa** agent (the one whose prompt you pasted).  
   **Unassigned = call is accepted then dropped.** This is the usual inbound failure after outbound already works.
4. Recommended for a demo:
   - **Enable transcript:** On (optional, useful for judges).
   - **Max call duration:** 300 is fine.
   - **Silence timeout:** 30–45 seconds is better than 120 for a live demo.
   - **End call on conversation end:** On.
   - **End call on silence:** On.
5. Click **Save changes**.

Username/password on that screen are **only for outbound SIP**. Inbound does not use them; inbound uses the Vobiz origination URI + inbound trunk.

### Step E — Test inbound

1. From a **different** mobile (not the same line if it confuses you), dial **+917971443138**.
2. You should hear Liaa’s greeting (Hindi/Hinglish), not a Vobiz IVR and not dead air.
3. Speak about a crop. Interrupt her once to show barge-in.
4. If it fails, check [Vobiz call logs](https://console.vobiz.ai/app/sip/logs) and Agora agent call history.

| Symptom | Likely cause |
|---------|----------------|
| Instant disconnect | Inbound agent still Unassigned |
| Rings, then XML/IVR voice | Number still on Voice App **test** |
| Rings, silence / one-way audio | Wrong SBC (not `sbc-ap-south.viblinx.com`) or TCP vs UDP mismatch |
| Never rings | Number not linked on inbound trunk, trunk disabled |

CSV **Campaigns** do not test inbound. Only dialing the DID does.


## Test

- Inbound: call `+917971443138` from a mobile.
- Outbound: Agora campaign with your own mobile as the contact.
- Vobiz [Call logs](https://console.vobiz.ai/app/sip/logs).

## If 401/403 outbound

Credential not on the trunk, or Agora username/password mismatch.

## If inbound rings but no agent

Number not linked on inbound trunk, or Agora inbound agent still **Unassigned**. Wrong region SBC (must be AP South for +91).
