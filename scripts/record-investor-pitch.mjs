/**
 * Record investor pitch video (visual) and merge with investor-recording.m4a
 * Usage: npm run dev (separate terminal) then node scripts/record-investor-pitch.mjs
 */
import { spawnSync } from "child_process";
import { existsSync, mkdirSync, readdirSync, renameSync, unlinkSync } from "fs";
import { join, dirname } from "path";
import { fileURLToPath } from "url";

const __dir = dirname(fileURLToPath(import.meta.url));
const root = join(__dir, "..");
const outDir = join(root, "public", "pitch-video");
const audioPath = join(root, "public", "pitch-audio", "investor-recording.m4a");
const baseUrl = process.env.PITCH_URL || "http://localhost:3000";
const recordUrl = `${baseUrl}/pitch/investor?record=1`;

async function main() {
  if (!existsSync(audioPath)) {
    throw new Error("Missing public/pitch-audio/investor-recording.m4a");
  }

  mkdirSync(outDir, { recursive: true });

  let chromium;
  try {
    chromium = await import("playwright").then((m) => m.chromium);
  } catch {
    console.log("Installing playwright…");
    spawnSync("npm", ["install", "-D", "playwright"], {
      cwd: root,
      stdio: "inherit",
      shell: true,
    });
    spawnSync("npx", ["playwright", "install", "chromium"], {
      cwd: root,
      stdio: "inherit",
      shell: true,
    });
    chromium = await import("playwright").then((m) => m.chromium);
  }

  console.log(`Recording ${recordUrl} …`);
  const browser = await chromium.launch({
    headless: true,
    args: ["--autoplay-policy=no-user-gesture-required"],
  });
  const context = await browser.newContext({
    viewport: { width: 1920, height: 1080 },
    recordVideo: {
      dir: outDir,
      size: { width: 1920, height: 1080 },
    },
  });
  const page = await context.newPage();
  await page.goto(recordUrl, { waitUntil: "domcontentloaded", timeout: 120_000 });

  /* Warm CRM iframes (dashboard Call mix) before starting narration */
  await page.waitForTimeout(8_000);
  await page.waitForFunction(
    () => typeof window.__pitchStart === "function",
    null,
    { timeout: 20_000 },
  );

  const started = await page.evaluate(async () => {
    const start = window.__pitchStart;
    if (!start) return { ok: false, reason: "no __pitchStart" };
    await start();
    const audio = document.querySelector("audio");
    return {
      ok: Boolean(audio && !audio.paused),
      currentTime: audio?.currentTime ?? -1,
      paused: audio?.paused ?? true,
    };
  });
  console.log("Playback start:", started);
  if (!started.ok) {
    throw new Error(
      `Pitch audio did not start — slides would stay frozen (${JSON.stringify(started)})`,
    );
  }

  /* Confirm dashboard iframe is in DOM before its beat */
  await page.waitForSelector('iframe[src*="embed=1"]', { timeout: 15_000 }).catch(() => {
    console.warn("embed iframes not found yet");
  });

  await page.waitForTimeout(118_000);
  await context.close();
  await browser.close();

  const webm = readdirSync(outDir).find((f) => f.endsWith(".webm"));
  if (!webm) throw new Error("No webm recording found");
  const webmPath = join(outDir, webm);
  const mergedPath = join(outDir, "krishisaathi-investor-pitch.mp4");

  let ffmpeg = "ffmpeg";
  try {
    const probe = spawnSync(
      "python",
      ["-c", "import imageio_ffmpeg; print(imageio_ffmpeg.get_ffmpeg_exe())"],
      { encoding: "utf8" },
    );
    if (probe.status === 0 && probe.stdout?.trim()) {
      ffmpeg = probe.stdout.trim();
    }
  } catch {
    /* system ffmpeg */
  }

  console.log("Merging audio + video…");
  const merge = spawnSync(
    ffmpeg,
    [
      "-y",
      "-i",
      webmPath,
      "-i",
      audioPath,
      "-c:v",
      "libx264",
      "-preset",
      "fast",
      "-crf",
      "20",
      "-pix_fmt",
      "yuv420p",
      "-c:a",
      "aac",
      "-b:a",
      "192k",
      "-shortest",
      "-movflags",
      "+faststart",
      mergedPath,
    ],
    { stdio: "inherit" },
  );

  if (merge.status !== 0) throw new Error("ffmpeg merge failed");

  try {
    unlinkSync(webmPath);
  } catch {
    /* keep webm if delete fails */
  }

  console.log(`\n✓ Video ready: ${mergedPath}`);
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
