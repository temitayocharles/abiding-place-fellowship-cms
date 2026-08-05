const { chromium } = require('playwright-core');

const base = String(process.env.PREVIEW_URL || '').replace(/\/$/, '');
const password = process.env.PREVIEW_PASSWORD || '';
const browserPath = process.env.CHROME_PATH || '';

const resources = [
  ['/', 'Welcome to Abiding Place'],
  ['/about.html', 'Our Story, Leadership and Faith'],
  ['/ministries.html', 'Ministries Rooted in Relationship'],
  ['/events.html', 'Regular Weekly Gatherings'],
  ['/contact.html', 'Mel Lloyd Centre'],
  ['/admin/', 'Content Editor · Abiding Place Fellowship'],
  ['/admin/help.html', 'Website Editor Help'],
  ['/manage.html', 'Website Administration · Abiding Place Fellowship'],
  ['/admin/config.yml', 'name: git-gateway'],
  ['/content/site-data.json', 'Mel Lloyd Centre'],
];

function requireValue(value, message) {
  if (!value) throw new Error(message);
}

async function authenticate(context) {
  const page = await context.newPage();
  await page.goto(base, { waitUntil: 'domcontentloaded', timeout: 30_000 });

  const passwordInput = page.locator('input[type="password"]');
  if (await passwordInput.count()) {
    await passwordInput.fill(password);
    const submit = page.locator('button[type="submit"], input[type="submit"], button').first();
    if (!(await submit.count())) throw new Error('Password page has no submit control');
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30_000 }).catch(() => null),
      submit.click(),
    ]);
  }

  if (await page.locator('input[type="password"]').count()) {
    throw new Error('Anonymous preview password was not accepted');
  }
  await page.close();
}

async function validate() {
  requireValue(base, 'PREVIEW_URL is required');
  requireValue(password, 'PREVIEW_PASSWORD is required');
  requireValue(browserPath, 'CHROME_PATH is required');

  const browser = await chromium.launch({
    headless: true,
    executablePath: browserPath,
    args: ['--no-sandbox', '--disable-dev-shm-usage'],
  });

  try {
    const context = await browser.newContext();
    await authenticate(context);

    const responses = new Map();
    for (const [path, expectedText] of resources) {
      const response = await context.request.get(`${base}${path}`, {
        failOnStatusCode: false,
        timeout: 30_000,
        maxRedirects: 5,
      });
      const status = response.status();
      const body = await response.text();
      console.log(`${path} -> HTTP ${status}`);
      if (status !== 200) throw new Error(`${path} returned HTTP ${status}`);
      if (!body.includes(expectedText)) {
        console.log(`${path} response preview: ${body.slice(0, 500)}`);
        throw new Error(`${path} is missing expected content: ${expectedText}`);
      }
      responses.set(path, { headers: response.headers(), body });
    }

    const siteData = JSON.parse(responses.get('/content/site-data.json').body);
    if (!siteData.contact || !String(siteData.contact.venue || '').includes('Mel Lloyd Centre')) {
      throw new Error('Generated contact venue is incorrect');
    }
    if (!Array.isArray(siteData.gatherings) || siteData.gatherings.length < 3) {
      throw new Error('Generated weekly gatherings are incomplete');
    }

    const adminHeaders = responses.get('/admin/').headers;
    const homeHeaders = responses.get('/').headers;
    const configHeaders = responses.get('/admin/config.yml').headers;
    const adminRobots = String(adminHeaders['x-robots-tag'] || '').toLowerCase();
    const homeContentType = String(homeHeaders['x-content-type-options'] || '').toLowerCase();
    const configCache = String(configHeaders['cache-control'] || '').toLowerCase();

    if (!adminRobots.includes('noindex')) {
      throw new Error('Admin route is missing X-Robots-Tag noindex protection');
    }
    if (homeContentType !== 'nosniff') {
      throw new Error('Public pages are missing X-Content-Type-Options: nosniff');
    }
    if (!configCache.includes('no-store') && !configCache.includes('no-cache')) {
      throw new Error('CMS configuration is missing a restrictive cache policy');
    }

    console.log('All authenticated live Netlify preview checks passed.');
  } finally {
    await browser.close();
  }
}

validate().catch((error) => {
  console.error(error.stack || error.message || error);
  process.exit(1);
});
