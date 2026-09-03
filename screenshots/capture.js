const { chromium } = require('playwright');
const path = require('path');
const fs = require('fs');

async function captureScreenshots() {
  const outputDir = path.join(__dirname, '..', 'docs', 'screenshots');
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

  // Wait for fonts to load
  await page.waitForTimeout(3000);

  // Define pages and their selectors (matching new mockup structure)
  const pages = [
    { name: '01_landing_page', selector: '.page-landing' },
    { name: '02_how_it_works', selector: '.page-how-it-works' },
    { name: '03_use_cases', selector: '.page-use-cases' },
    { name: '04_onboarding_industry', selector: '.page-onboarding' },
    { name: '05_dashboard', selector: '.page-dashboard' },
    { name: '06_chat', selector: '.page-chat-overview' },
    { name: '07_marketplace', selector: '.page-marketplace' },
    { name: '08_trust_security', selector: '.page-trust' },
    { name: '09_leads_crm', selector: '.page-leads' },
    { name: '10_email_hub', selector: '.page-email' },
    { name: '11_mission_control', selector: '.page-chat-live' },
    { name: '12_smart_booking', selector: '.page-booking' },
    { name: '13_ai_goals', selector: '.page-goals' },
    { name: '14_knowledge_hub', selector: '.page-knowledge' },
    { name: '15_ab_testing', selector: '.page-abtests' },
    { name: '16_customer_journey', selector: '.page-journey' },
    { name: '17_sentiment_workflows', selector: '.page-sentiment' },
    { name: '18_nl_analytics', selector: '.page-nlanalytics' },
    { name: '19_revenue_attribution', selector: '.page-revenue' },
  ];

  for (const p of pages) {
    try {
      const element = await page.$(p.selector);
      if (element) {
        const filePath = path.join(outputDir, `${p.name}.png`);
        await element.screenshot({ path: filePath, type: 'png' });
        console.log(`✅ Captured: ${p.name}.png`);
      } else {
        console.log(`⚠️  Element not found for: ${p.name} (selector: ${p.selector})`);
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
