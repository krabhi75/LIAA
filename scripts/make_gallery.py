from pathlib import Path

from PIL import Image, ImageDraw, ImageFont

OUT = Path("docs/gallery")
OUT.mkdir(parents=True, exist_ok=True)

NAVY = (12, 15, 20)
PANEL = (20, 25, 34)
GOLD = (212, 177, 95)
CREAM = (246, 240, 228)
MUTED = (139, 151, 171)
WHITE = (232, 237, 245)
GREEN = (110, 231, 183)
RED = (248, 113, 113)


def font(size: int, bold: bool = False) -> ImageFont.FreeTypeFont | ImageFont.ImageFont:
    names = [
        "C:/Windows/Fonts/segoeuib.ttf" if bold else "C:/Windows/Fonts/segoeui.ttf",
        "C:/Windows/Fonts/arialbd.ttf" if bold else "C:/Windows/Fonts/arial.ttf",
    ]
    for name in names:
        try:
            return ImageFont.truetype(name, size)
        except OSError:
            continue
    return ImageFont.load_default()


def card(path: Path, title: str, lines: list[str], kicker: str = "मोलवाणी") -> None:
    img = Image.new("RGB", (1600, 900), NAVY)
    d = ImageDraw.Draw(img)
    d.rectangle((0, 0, 18, 900), fill=GOLD)
    d.text((72, 70), kicker, fill=GOLD, font=font(28, True))
    d.text((72, 130), title, fill=CREAM, font=font(64, True))
    y = 250
    for line in lines:
        d.text((72, y), line, fill=WHITE, font=font(32))
        y += 56
    d.text((72, 820), "EchoSphere PS21  ·  Agora Conversational AI  ·  Bharat", fill=MUTED, font=font(22))
    img.save(path, "PNG")


def desk_mock(path: Path) -> None:
    img = Image.new("RGB", (1600, 900), NAVY)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((40, 40, 980, 860), 18, fill=PANEL)
    d.rounded_rectangle((1020, 40, 1560, 480), 18, fill=PANEL)
    d.rounded_rectangle((1020, 510, 1560, 860), 18, fill=PANEL)
    d.text((64, 64), "MolVaani  ·  live call", fill=GOLD, font=font(28, True))
    d.rounded_rectangle((64, 120, 260, 168), 8, fill=GOLD)
    d.text((88, 128), "Listening", fill=NAVY, font=font(22, True))
    transcript = [
        ("You", "Pehle pricing batao — kitna per user?"),
        ("Maya", "Growth is twenty-eight dollars per user. How many seats?"),
        ("You", "Wait — Slack se kaise alag hai?"),
        ("Maya", "Slack is chat-first. MolVaani keeps work next to the talk."),
        ("You", "Seats fifty ho gaye. Enterprise demo chahiye."),
        ("Maya", "Updated to fifty. I can book Thursday 4pm IST."),
    ]
    y = 200
    for who, text in transcript:
        color = GOLD if who == "Maya" else WHITE
        d.text((64, y), who, fill=color, font=font(22, True))
        d.text((64, y + 34), text, fill=WHITE, font=font(24))
        y += 100
    d.text((1044, 64), "CRM  ·  live lead", fill=MUTED, font=font(22, True))
    d.text((1044, 110), "Outcome: Demo booked", fill=GREEN, font=font(28, True))
    fields = [
        ("Company", "Pune Foods Pvt Ltd"),
        ("Seats", "50"),
        ("Plan", "Enterprise"),
        ("Competitor", "Slack"),
        ("Objection", "Pricing, product"),
    ]
    y = 170
    for label, value in fields:
        d.text((1044, y), label.upper(), fill=MUTED, font=font(16))
        d.text((1044, y + 26), value, fill=CREAM, font=font(26, True))
        y += 58
    d.text((1044, 540), "Tool calls", fill=MUTED, font=font(22, True))
    for i, tool in enumerate(
        ["get_pricing", "compare_competitor", "upsert_crm_lead", "book_demo"],
    ):
        d.text((1044, 590 + i * 50), f"▸  {tool}", fill=GOLD, font=font(24))
    img.save(path, "PNG")


def human_mock(path: Path) -> None:
    img = Image.new("RGB", (1600, 900), NAVY)
    d = ImageDraw.Draw(img)
    d.rounded_rectangle((80, 80, 1520, 820), 20, fill=PANEL)
    d.text((120, 120), "MolVaani  ·  Human specialist", fill=GOLD, font=font(26, True))
    d.text((120, 180), "Warm transfer desk", fill=CREAM, font=font(52, True))
    d.rounded_rectangle((120, 280, 420, 340), 8, fill=GOLD)
    d.text((148, 292), "Join live channel", fill=NAVY, font=font(22, True))
    d.rounded_rectangle((450, 280, 760, 340), 8, fill=RED)
    d.text((478, 292), "Stop Maya (handover)", fill=NAVY, font=font(22, True))
    d.text((120, 400), "Conversation context", fill=GOLD, font=font(24, True))
    d.text((120, 460), "Reason: Buyer asked for custom MSA and India data residency.", fill=WHITE, font=font(26))
    d.text((120, 520), "Summary: Pune Foods, 50 seats, Slack comparison, wants", fill=WHITE, font=font(26))
    d.text((120, 570), "Thursday 4pm IST enterprise demo. Trust objection on security.", fill=WHITE, font=font(26))
    d.text((120, 660), "Company", fill=MUTED, font=font(18))
    d.text((120, 694), "Pune Foods Pvt Ltd", fill=CREAM, font=font(28, True))
    d.text((620, 660), "Seats", fill=MUTED, font=font(18))
    d.text((620, 694), "50", fill=CREAM, font=font(28, True))
    img.save(path, "PNG")


def box(d: ImageDraw.ImageDraw, xy: tuple[int, int, int, int], title: str, sub: str) -> None:
    d.rounded_rectangle(xy, 14, fill=PANEL, outline=GOLD, width=2)
    d.text((xy[0] + 22, xy[1] + 18), title, fill=GOLD, font=font(22, True))
    d.text((xy[0] + 22, xy[1] + 52), sub, fill=WHITE, font=font(20))


def architecture(path: Path) -> None:
    img = Image.new("RGB", (1600, 900), NAVY)
    d = ImageDraw.Draw(img)
    d.text((72, 40), "मोलवाणी", fill=GOLD, font=font(22, True))
    d.text((72, 78), "Architecture — Agora owns the voice", fill=CREAM, font=font(42, True))
    box(d, (72, 180, 500, 340), "Buyer browser", "RTC uid 1002  ·  mic in Bharat")
    box(d, (560, 180, 1040, 340), "Agora Conversational AI", "Turn-taking  ·  barge-in  ·  STT/LLM/TTS")
    box(d, (1100, 180, 1528, 340), "Maya (agent uid 123456)", "MolVaani sales voice")
    box(d, (72, 420, 760, 620), "MolVaani business server", "Tokens  ·  start/stop agent  ·  MCP tools")
    box(d, (840, 420, 1528, 620), "CRM + catalog + calendar", "Pricing  ·  competitor  ·  demo  ·  escalate")
    box(d, (72, 680, 1528, 840), "Human specialist  ·  uid 2002", "Same channel  ·  conversation context  ·  Stop Maya for warm transfer")
    img.save(path, "PNG")


def call_flow(path: Path) -> None:
    img = Image.new("RGB", (1600, 900), NAVY)
    d = ImageDraw.Draw(img)
    d.text((72, 40), "मोलवाणी", fill=GOLD, font=font(22, True))
    d.text((72, 78), "PS21 live call — mol-bhav, not a script", fill=CREAM, font=font(40, True))
    steps = [
        ("1", "Pricing pehle", "Buyer asks rate. Maya retrieves catalog."),
        ("2", "Interrupt", "Slack / Teams comparison mid-sentence."),
        ("3", "Seats badlo", "50 users. Maya re-prices and remembers."),
        ("4", "Enterprise demo", "Thursday 4pm IST booked on calendar."),
        ("5", "CRM sauda", "Lead + outcome on the live desk."),
        ("6", "Human if stuck", "MSA / residency → specialist joins."),
    ]
    for i, (num, title, sub) in enumerate(steps):
        col = i % 3
        row = i // 3
        x0 = 72 + col * 500
        y0 = 180 + row * 320
        d.rounded_rectangle((x0, y0, x0 + 460, y0 + 260), 16, fill=PANEL)
        d.ellipse((x0 + 28, y0 + 28, x0 + 88, y0 + 88), fill=GOLD)
        d.text((x0 + 48, y0 + 38), num, fill=NAVY, font=font(28, True))
        d.text((x0 + 110, y0 + 40), title, fill=CREAM, font=font(28, True))
        d.text((x0 + 28, y0 + 130), sub, fill=WHITE, font=font(24))
    img.save(path, "PNG")


card(
    OUT / "01-title-molvaani.png",
    "MolVaani",
    [
        "The voice that closes the sauda.",
        "Live Agora sales agent for Bharat — interrupt, bargain, remember.",
        "Not a chatbot. Real-time conversation with CRM and human handoff.",
    ],
)
desk_mock(OUT / "02-live-desk.png")
human_mock(OUT / "03-human-handoff.png")
architecture(OUT / "04-architecture.png")
call_flow(OUT / "05-call-flow.png")

print("gallery ready", sorted(p.name for p in OUT.glob("*")))
