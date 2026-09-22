// Downloads every asset used by https://www.mikes.cv/ into this page's
// namespaced public directory. Run with: node scripts/download-assets-www-mikes-cv-de975993-root-8a5edab2.mjs
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const ORIGIN = "https://www.mikes.cv";
const ROOT = join(
  dirname(fileURLToPath(import.meta.url)),
  "..",
  "public/sites/www-mikes-cv-de975993/root-8a5edab2",
);

const shots = ["fahlo", "matter-ios", "contact", "webex", "sakara", "immi"].flatMap(
  (name) => ["left", "middle", "right"].map((side) => `/folio/shots/${name}-${side}.png`),
);

// [remote path, local path relative to ROOT]
const ASSETS = [
  ["/assets/a-BwCKRlZ-.woff2", "fonts/mb-sans-400.woff2"],
  ["/assets/b-C3VRySno.woff2", "fonts/mb-sans-500.woff2"],
  ["/assets/c-ClSDCIEF.woff2", "fonts/mb-mono-400.woff2"],
  ["/assets/d-CQR7nPae.woff2", "fonts/mb-mono-500.woff2"],
  ["/assets/DS-Digital-dG6DdXEc.ttf", "fonts/ds-digital.ttf"],
  ["/cloud.png", "cloud.png"],
  ["/CirrusCloud.png", "CirrusCloud.png"],
  ["/waternormals.jpg", "waternormals.jpg"],
  ["/window-back.webp", "window-back.webp"],
  ["/window-shutter.webp", "window-shutter.webp"],
  ["/window-front.webp", "window-front.webp"],
  ["/shade-on.m4a", "shade-on.m4a"],
  ["/folio/boarding-pass.png", "folio/boarding-pass.png"],
  ["/folio/boarding-pass-back.png", "folio/boarding-pass-back.png"],
  ...[
    "studio",
    "fahlo",
    "matter-dark",
    "matter-blue",
    "contact",
    "fueled",
    "immi",
    "sakara",
    "webex",
  ].map((n) => [`/folio/logo-${n}.png`, `folio/logo-${n}.png`]),
  ...shots.map((p) => [p, p.slice(1)]),
  ...[1, 2, 3, 4, 5].map((n) => [`/folio/memories/m${n}.jpg`, `folio/memories/m${n}.jpg`]),
  ["/favicon.svg", "seo/favicon.svg"],
  ["/og-image.jpg", "seo/og-image.jpg"],
];

async function download([remote, local]) {
  const res = await fetch(ORIGIN + remote);
  if (!res.ok) throw new Error(`${res.status} ${remote}`);
  const dest = join(ROOT, local);
  await mkdir(dirname(dest), { recursive: true });
  await writeFile(dest, Buffer.from(await res.arrayBuffer()));
  return local;
}

let ok = 0;
const failed = [];
for (let i = 0; i < ASSETS.length; i += 4) {
  const batch = ASSETS.slice(i, i + 4);
  const results = await Promise.allSettled(batch.map(download));
  results.forEach((r, j) => {
    if (r.status === "fulfilled") ok++;
    else failed.push(`${batch[j][0]}: ${r.reason.message}`);
  });
}
console.log(`Downloaded ${ok}/${ASSETS.length} assets into ${ROOT}`);
if (failed.length) {
  console.error("Failed:\n" + failed.join("\n"));
  process.exitCode = 1;
}
