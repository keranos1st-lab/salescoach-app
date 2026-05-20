import { copyFileSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = join(root, "public");
const appDir = join(root, "app");
const svg = readFileSync(join(publicDir, "favicon.svg"));

const outputs = [
  { file: "favicon-16x16.png", size: 16 },
  { file: "favicon-32x32.png", size: 32 },
  { file: "apple-touch-icon.png", size: 180 },
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
];

for (const { file, size } of outputs) {
  const buffer = await sharp(svg).resize(size, size).png().toBuffer();
  writeFileSync(join(publicDir, file), buffer);
  console.log(`Wrote ${file}`);
}

const png16 = await sharp(svg).resize(16, 16).png().toBuffer();
const png32 = await sharp(svg).resize(32, 32).png().toBuffer();
const ico = await pngToIco([png16, png32]);
writeFileSync(join(publicDir, "favicon.ico"), ico);
console.log("Wrote favicon.ico");

copyFileSync(join(publicDir, "favicon.ico"), join(appDir, "favicon.ico"));
copyFileSync(join(publicDir, "favicon-32x32.png"), join(appDir, "icon.png"));
copyFileSync(join(publicDir, "apple-touch-icon.png"), join(appDir, "apple-icon.png"));
console.log("Copied favicon.ico, icon.png, apple-icon.png → app/");
