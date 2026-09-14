/**
 * Converts the SVG architecture diagram to PNG at multiple scales.
 * Usage: npx tsx scripts/render-svg-to-png.ts
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const SVG_PATH = path.resolve('docs/images/VOID_Architecture.svg');
const PNG_DIR = path.resolve('docs/images');
const SCALES = [
  { name: 'standard', scale: 1 },
  { name: 'high-res', scale: 2.5 },
] as const;

async function main() {
  const svgContent = fs.readFileSync(SVG_PATH, 'utf-8');

  // Parse viewBox from SVG
  const viewBoxMatch = svgContent.match(/viewBox="([^"]+)"/);
  if (!viewBoxMatch) throw new Error('No viewBox found in SVG');
  const [, , width, height] = viewBoxMatch[1].split(' ').map(Number);

  const baseHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { background: white; display: flex; justify-content: center; align-items: center; }
    svg { display: block; }
  </style>
</head>
<body>
  ${svgContent}
</body>
</html>
`;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  for (const { name, scale } of SCALES) {
    const viewportWidth = Math.ceil(width * scale);
    const viewportHeight = Math.ceil(height * scale);

    await page.setViewportSize({ width: viewportWidth, height: viewportHeight });
    await page.setContent(baseHtml, { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(500);

    const pngPath = path.join(PNG_DIR, `VOID_Architecture_${name}.png`);
    await page.screenshot({ path: pngPath, fullPage: true });
    console.log(`✅ Saved: ${pngPath} (${viewportWidth}×${viewportHeight}px)`);
  }

  await browser.close();
  console.log('\nDone!');
}

main().catch(e => { console.error(e); process.exit(1); });
