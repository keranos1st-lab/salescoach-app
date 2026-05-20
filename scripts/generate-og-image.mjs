import { writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outPath = join(root, "public", "og-image.png");

const svg = `<?xml version="1.0" encoding="UTF-8"?>
<svg width="1200" height="630" viewBox="0 0 1200 630" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="#0f3638"/>
      <stop offset="72%" stop-color="#171614"/>
      <stop offset="100%" stop-color="#171614"/>
    </linearGradient>
  </defs>
  <rect width="1200" height="630" fill="url(#bg)"/>
  <circle cx="100" cy="315" r="280" fill="#01696f" opacity="0.12"/>
  <rect x="60" y="60" width="60" height="60" rx="14" fill="#01696f"/>
  <text x="90" y="98" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="700" text-anchor="middle">S</text>
  <text x="140" y="100" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="36" font-weight="700">SalesCoach</text>
  <text x="60" y="240" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="700">Контроль отдела продаж</text>
  <text x="60" y="310" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="52" font-weight="700">на основе данных</text>
  <text x="60" y="370" fill="#4f98a3" font-family="Arial, Helvetica, sans-serif" font-size="20">Анализ звонков · Отчёты по менеджерам · Рекомендации</text>
  <rect x="60" y="460" width="200" height="44" rx="20" fill="#01696f" opacity="0.4"/>
  <text x="80" y="488" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="16">📊 Анализ звонков</text>
  <rect x="270" y="460" width="270" height="44" rx="20" fill="#01696f" opacity="0.4"/>
  <text x="290" y="488" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="16">📋 Управленческие отчёты</text>
  <rect x="560" y="460" width="200" height="44" rx="20" fill="#01696f" opacity="0.4"/>
  <text x="580" y="488" fill="#ffffff" font-family="Arial, Helvetica, sans-serif" font-size="16">⚠️ Карта рисков</text>
</svg>`;

await sharp(Buffer.from(svg)).resize(1200, 630).png().toFile(outPath);

console.log(`Wrote ${outPath}`);
