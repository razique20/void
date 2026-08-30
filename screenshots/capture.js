const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function captureScreenshots() {
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) fs.mkdirSync(outputDir, { recursive: true });

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1280, height: 900 },
    deviceScaleFactor: 2,
  });
  const page = await context.newPage();

  // Navigate to mockup file
  const mockupPath = path.join(__dirname, 'mockup.html');
  await page.goto(`file://${mockupPath}`, { waitUntil: 'networkidle', timeout: 60000 });

  // Wait for Tailwind CSS to load
  await page.waitForTimeout(2000);

  // Define pages and their selectors
  const pages = [
    { name: '01_landing_page', selector: '.page:nth-child(1)' },
    { name: '02_how_it_works', selector: '.page:nth-child(2)' },
    { name: '03_use_cases', selector: '.page:nth-child(3)' },
    { name: '04_onboarding_industry', selector: '.page:nth-child(4)' },
    { name: '05_dashboard', selector: '.page:nth-child(5)' },
    { name: '06_chat', selector: '.page:nth-child(6)' },
    { name: '07_marketplace', selector: '.page:nth-child(7)' },
    { name: '08_trust_security', selector: '.page:nth-child(8)' },
    { name: '09_leads_crm', selector: '.page:nth-child(9)' },
    { name: '10_email_hub', selector: '.page:nth-child(10)' },
    { name: '11_mission_control', selector: '.page:nth-child(11)' },
  ];

  for (const p of pages) {
    try {
      const element = await page.$(p.selector);
      if (element) {
        const filePath = path.join(outputDir, `${p.name}.png`);
        await element.screenshot({ path: filePath, type: 'png' });
        console.log(`✅ Captured: ${p.name}.png`);
      } else {
        console.log(`⚠️  Element not found for: ${p.name}`);
      }
    } catch (err) {
      console.log(`❌ Error capturing ${p.name}: ${err.message}`);
    }
  }

  // Also capture full page
  try {
    await page.screenshot({ 
      path: path.join(outputDir, 'full_platform_mockup.png'), 
      fullPage: true, 
      type: 'png' 
    });
    console.log('✅ Captured: full_platform_mockup.png');
  } catch (err) {
    console.log(`❌ Error capturing full page: ${err.message}`);
  }

  await browser.close();
  console.log('\n🎉 All screenshots captured successfully!');
  console.log(`📁 Output directory: ${outputDir}`);
}

captureScreenshots().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
