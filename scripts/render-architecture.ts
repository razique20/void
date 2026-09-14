/**
 * Renders the VOID architecture Mermaid diagram to PNG.
 * Uses a local Mermaid bundle for reliability.
 * Usage: npx tsx scripts/render-architecture.ts
 */
import { chromium } from 'playwright';
import fs from 'fs';
import path from 'path';

const MMD_PATH = path.resolve('docs/images/VOID_Architecture.mmd');
const PNG_DIR = path.resolve('docs/images');
const SIZES = [
  { name: 'medium', scale: 1.5 },
  { name: 'large', scale: 2.5 },
] as const;

async function main() {
  const mmdRaw = fs.readFileSync(MMD_PATH, 'utf-8');
  const mmdContent = mmdRaw.replace(/^```mermaid\s*/, '').replace(/\s*```$/, '').trim();

  // Inline Mermaid + Playwright renderer
  const html = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <script src="https://cdn.jsdelivr.net/npm/mermaid@11/dist/mermaid.min.js"></script>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { background: white; display: flex; justify-content: center; align-items: center; min-height: 100vh; padding: 40px; }
    #chart { width: 100%; overflow: visible; }
    .mermaid { text-align: center; }
    svg { display: block; margin: 0 auto; }
  </style>
</head>
<body>
  <div id="chart"></div>
  <script>
    mermaid.initialize({
      startOnLoad: false,
      theme: 'neutral',
      securityLevel: 'loose',
      flowchart: {
        useMaxWidth: true,
        htmlLabels: true,
        curve: 'basis',
        padding: 20,
      },
      sequence: { showMarkdown: false },
    });

    const graphDefinition = \`${mmdContent}\`;

    (async () => {
      try {
        const { svg } = await mermaid.render('mermaid-chart', graphDefinition);
        document.getElementById('chart').innerHTML = svg;
        document.body.dispatchEvent(new Event('mermaid-ready'));
      } catch (e) {
        document.body.innerHTML = '<pre style="color:red;padding:20px;font-size:14px;">Error rendering diagram:\\n' + e.message + '\\n\\n' + e.stack + '</pre>';
        console.error(e);
        document.body.dispatchEvent(new Event('mermaid-error'));
      }
    })();
  </script>
</body>
</html>
`;

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  // Listen for errors
  page.on('console', msg => {
    if (msg.type() === 'error') console.log('Console error:', msg.text());
  });

  for (const { name, scale } of SIZES) {
    console.log(`\nRendering ${name} (scale ${scale}x)...`);

    await page.setContent(html, { waitUntil: 'domcontentloaded' });

    // Wait for Mermaid to finish rendering
    const ready = await page.waitForFunction(
      () => document.querySelector('svg.mermaid') !== null || document.querySelector('pre') !== null,
      { timeout: 45000 }
    ).catch(() => null);

    if (!ready) {
      console.error('⚠ Mermaid did not render within timeout');
      const bodyText = await page.$eval('body', el => el.innerText.slice(0, 500));
      console.error('Body content:', bodyText);
      continue;
    }

    // Check if there was an error
    const hasError = await page.$eval('body', el => el.querySelector('pre') !== null);
    if (hasError) {
      const errText = await page.$eval('pre', el => el.innerText);
      console.error('Mermaid error:', errText.slice(0, 500));
      continue;
    }

    // Wait for any animations to settle
    await page.waitForTimeout(1500);

    const svgEl = await page.$('svg.mermaid');
    const svgBounds = await svgEl?.boundingBox();

    if (!svgBounds) {
      console.error('No SVG bounds found');
      continue;
    }

    // Add padding around the diagram
    const padding = 80;
    const width = Math.ceil(svgBounds.width + padding * 2);
    const height = Math.ceil(svgBounds.height + padding * 2);

    await page.setViewportSize({ width, height });

    // Center the SVG in viewport
    await page.evaluate((pad: number) => {
      const svg = document.querySelector('svg.mermaid') as SVGElement | null;
      if (svg) {
        svg.style.position = 'absolute';
        svg.style.left = String(pad) + 'px';
        svg.style.top = String(pad) + 'px';
      }
    }, padding);

    await page.waitForTimeout(500);

    const pngPath = path.join(PNG_DIR, `VOID_Architecture_${name}.png`);
    await page.screenshot({ path: pngPath, fullPage: true });
    console.log(`✅ Saved: ${pngPath} (${width}×${height}px)`);
  }

  await browser.close();
  console.log('\nDone!');
}

main().catch(e => { console.error(e); process.exit(1); });
