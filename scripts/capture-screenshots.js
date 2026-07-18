#!/usr/bin/env node
/**
 * Screenshot capture script for Abiding Place Fellowship website audit
 * Run this AFTER creating a Netlify branch preview deployment
 * 
 * Usage:
 * 1. Create branch preview in Netlify (Deploy from fix/build-system-alignment)
 * 2. Get the preview URL (e.g., https://deploy-preview-1--abiding-place-ministries.netlify.app)
 * 3. Set PREVIEW_URL environment variable or pass as argument
 * 4. Run: npm run capture-screenshots
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const VIEWPORTS = [1440, 1024, 768, 430, 390, 360];
const PAGES = [
  { name: 'home', path: '/' },
  { name: 'about', path: '/about.html' },
  { name: 'ministries', path: '/ministries.html' },
  { name: 'events', path: '/events.html' },
  { name: 'contact', path: '/contact.html' }
];

const OUTPUT_DIR = path.join(__dirname, 'docs/audit/screenshots');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  console.log('Created screenshots directory:', OUTPUT_DIR);
}

// Get preview URL from environment or argument
const previewUrl = process.env.PREVIEW_URL || process.argv[2];

if (!previewUrl) {
  console.error('ERROR: No preview URL provided');
  console.error('Usage: PREVIEW_URL=<url> npm run capture-screenshots');
  console.error('Example: PREVIEW_URL=https://deploy-preview-1--abiding-place-ministries.netlify.app npm run capture-screenshots');
  process.exit(1);
}

console.log('='.repeat(60));
console.log('Screenshot Capture Script');
console.log('Preview URL:', previewUrl);
console.log('Viewport widths:', VIEWPORTS.join(', '));
console.log('Pages:', PAGES.map(p => p.name).join(', '));
console.log('='.repeat(60));

// Install playwright if not already installed
try {
  console.log('\nChecking Playwright installation...');
  execSync('npx playwright --version', { stdio: 'inherit' });
} catch (err) {
  console.log('Installing Playwright...');
  execSync('npx playwright install --with-deps chromium', { stdio: 'inherit' });
}

// Generate capture commands for documentation
console.log('\n--- RECOMMENDED MANUAL CAPTURE STEPS ---');
console.log('If automated capture fails, use these manual steps:\n');

PAGES.forEach(page => {
  VIEWPORTS.forEach(width => {
    const filename = `${page.name}-${width}.png`;
    const url = previewUrl.replace(/\/$/, '') + page.path;
    console.log(`1. Open: ${url}`);
    console.log(`   Resize browser to ${width}px width`);
    console.log(`   Save as: ${filename}`);
  });
});

console.log('\n--- AUTOMATED CAPTURE (if Playwright works) ---');

// Automated capture using Playwright
async function captureScreenshots() {
  const { chromium } = require('playwright');
  
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();
  
  let successCount = 0;
  let failCount = 0;
  
  for (const viewport of VIEWPORTS) {
    await page.setViewportSize({ width: viewport, height: 900 });
    
    for (const { name: pageName, path: pagePath } of PAGES) {
      const url = previewUrl.replace(/\/$/, '') + pagePath;
      const filename = `${pageName}-${viewport}.png`;
      const outputPath = path.join(OUTPUT_DIR, filename);
      
      console.log(`\nCapturing: ${pageName} @ ${viewport}px → ${filename}`);
      
      try {
        await page.goto(url, { waitUntil: 'networkidle', timeout: 10000 });
        await page.screenshot({ path: outputPath, fullPage: false });
        console.log(`✅ Saved: ${filename}`);
        successCount++;
      } catch (err) {
        console.error(`❌ Failed: ${pageName} @ ${viewport}px - ${err.message}`);
        failCount++;
      }
    }
  }
  
  await browser.close();
  
  console.log('\n' + '='.repeat(60));
  console.log('SUMMARY');
  console.log('='.repeat(60));
  console.log(`✅ Success: ${successCount}`);
  console.log(`❌ Failed: ${failCount}`);
  console.log(`📁 Output: ${OUTPUT_DIR}`);
  
  if (failCount === 0) {
    console.log('\n🎉 All screenshots captured successfully!');
    console.log('Next step: git add docs/audit/screenshots && git commit -m "docs: Add audit screenshots"');
  } else {
    console.log('\n⚠️  Some screenshots failed. Use manual capture steps above.');
  }
}

// Run automated capture
captureScreenshots().catch(err => {
  console.error('Automated capture failed:', err.message);
  console.log('\nPlease use manual capture steps above.');
  console.log('Install Playwright first if needed: npx playwright install');
});