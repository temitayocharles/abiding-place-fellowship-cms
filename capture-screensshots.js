const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const PREVIEW_URL = 'https://deploy-preview-1--abiding-place-ministries-cms.netlify.app';
const PAGES = ['/', '/about', '/ministries', '/events', '/contact'];
const VIEWPORTS = [1440, 1024, 768, 430, 390, 360];
const OUTPUT_DIR = 'docs/audit/screenshots';

async function captureScreenshots() {
  console.log('🚀 Starting screenshot capture...');
  
  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  let successCount = 0;
  let failCount = 0;

  for (const pagePath of PAGES) {
    const pageName = pagePath === '/' ? 'home' : pagePath.substring(1);
    console.log(`\n📄 Capturing ${pageName} page...`);

    for (const width of VIEWPORTS) {
      const filename = `${pageName}-${width}.png`;
      const filePath = path.join(OUTPUT_DIR, filename);

      try {
        await page.goto(`${PREVIEW_URL}${pagePath}`, { 
          waitUntil: 'networkidle', 
          timeout: 15000 
        });
        await page.setViewportSize({ width, height: 1080 });
        await page.waitForTimeout(2000); // Wait for layout to settle
        
        await page.screenshot({ 
          path: filePath, 
          fullPage: true 
        });
        
        console.log(`✅ ${filename}`);
        successCount++;
      } catch (error) {
        console.error(`❌ ${filename}: ${error.message}`);
        failCount++;
      }
    }
  }

  await browser.close();

  console.log('\n📊 Summary:');
  console.log(`   ✅ Successful: ${successCount}`);
  console.log(`   ❌ Failed: ${failCount}`);
  console.log(`   📁 Output: ${path.resolve(OUTPUT_DIR)}`);

  if (failCount === 0) {
    console.log('\n🎉 All 30 screenshots captured successfully!');
  } else {
    console.log(`\n⚠️  ${failCount} screenshots failed. Please check logs above.`);
    process.exit(1);
  }
}

captureScreenshots().catch(console.error);