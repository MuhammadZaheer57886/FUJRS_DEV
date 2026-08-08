// Turns photography in assets/images-source/ into web-ready WebP.
//
//   npm run images
//
// Sources live OUTSIDE public/ deliberately. Everything under public/ is
// served at its own URL in production, so originals kept there would be
// publicly downloadable at full weight — the exact bytes this script exists to
// avoid shipping. `assets/` is never served; it is only ever an input.
//
// The originals are kept rather than replaced: a re-encode of a re-encode
// loses detail every pass, so the next conversion should start from these.
//
// WebP at quality 82 is the setting used here. Below ~75 the gold thread and
// embroidery detail in this catalogue starts to smear, which is the one thing
// these photographs are selling. Above ~88 the file grows with no visible
// gain on a screen.

import { mkdirSync, readdirSync, statSync } from "node:fs";
import { basename, extname, join } from "node:path";
import sharp from "sharp";

const SOURCE_DIR = "assets/images-source";
const OUTPUT_DIR = "public/images";

/**
 * Widest a hero is ever rendered, doubled for high-density screens.
 *
 * A full-bleed hero on a 1440pt display needs 2880 physical pixels at 2x.
 * Anything wider is bytes nobody sees.
 */
const MAX_WIDTH = 2880;
const QUALITY = 82;

/**
 * Smallest a hero source may be before it is upscaled on the way through.
 *
 * A full-bleed hero on a retina laptop is painted at roughly 3000 device
 * pixels wide. Handed something smaller, the browser stretches it with a
 * cheap bilinear filter and the result is visibly mushy — measured on the
 * 1376px originals, stone texture and embroidery both smeared.
 *
 * Upscaling here with lanczos3 and a light unsharp mask does NOT invent
 * detail, but it resamples far better than the GPU does and the edges survive.
 * It is a stopgap for an undersized original, not a substitute for one: if a
 * file gets upscaled, the log says so, and the real fix is a bigger source.
 */
const UPSCALE_BELOW = 2000;
const UPSCALE_TO = 2752;

const INPUT_EXTENSIONS = new Set([".jpg", ".jpeg", ".png", ".webp", ".avif"]);

mkdirSync(OUTPUT_DIR, { recursive: true });

const files = readdirSync(SOURCE_DIR).filter((name) =>
  INPUT_EXTENSIONS.has(extname(name).toLowerCase())
);

if (files.length === 0) {
  console.log(`Nothing to do — put your originals in ${SOURCE_DIR}/`);
  process.exit(0);
}

for (const file of files) {
  const input = join(SOURCE_DIR, file);
  const output = join(OUTPUT_DIR, `${basename(file, extname(file))}.webp`);

  const image = sharp(input);
  const { width = 0, height = 0 } = await image.metadata();

  const upscaling = width < UPSCALE_BELOW;
  const targetWidth = upscaling ? UPSCALE_TO : MAX_WIDTH;

  const pipeline = image.resize({
    width: targetWidth,
    kernel: "lanczos3",
    // Only enlarge when we have decided to; a source already wide enough is
    // shrunk to MAX_WIDTH at most and never blown up.
    withoutEnlargement: !upscaling,
  });

  // Sharpen only what was enlarged. Applying it to a downscale would crunch
  // detail that is already there.
  if (upscaling) pipeline.sharpen({ sigma: 1.0, m1: 0.6, m2: 2.5 });

  await pipeline.webp({ quality: QUALITY }).toFile(output);

  const before = statSync(input).size;
  const after = statSync(output).size;
  const saved = Math.round((1 - after / before) * 100);

  const finalWidth = upscaling ? UPSCALE_TO : Math.min(width, MAX_WIDTH);

  console.log(
    `${file} → ${basename(output)}  ` +
      `${width}×${height} → ${finalWidth}px wide  ` +
      `${(before / 1024 / 1024).toFixed(2)}MB → ${(after / 1024 / 1024).toFixed(2)}MB ` +
      `(${saved >= 0 ? "−" : "+"}${Math.abs(saved)}%)` +
      (upscaling ? `  ⚠ upscaled from ${width}px — a ${UPSCALE_BELOW}px+ original would be sharper` : "")
  );
}
