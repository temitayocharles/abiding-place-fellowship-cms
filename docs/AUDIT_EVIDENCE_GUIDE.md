# Audit Evidence Collection Guide

This guide walks you through capturing audit screenshots, creating a Netlify branch preview, and documenting the build process.

---

## Step 1: Create Netlify Branch Preview

### Option A: Automatic (via Pull Request)
1. Go to [GitHub PR #1](https://github.com/temitayocharles/abiding-place-fellowship-cms/pull/1)
2. Netlify will automatically create a preview deployment for the PR
3. Comment on the PR: `/deploy` if not auto-triggered
4. Wait for build to complete (~60 seconds)
5. Copy the preview URL from Netlify (shown in PR comments)

### Option B: Manual
1. Log in to [Netlify Dashboard](https://app.netlify.com/sites/abiding-place-ministries)
2. Click **"Deploys"** → **"Trigger deploy"** → **"Deploy from Git repository"**
3. Select branch: **`fix/build-system-alignment`**
4. Click **Deploy**
5. Wait for build to complete
6. Copy the **preview URL** from the deployment page

**Preview URL format:** `https://deploy-preview-1--abiding-place-ministries.netlify.app`

---

## Step 2: Capture Screenshots

### Automated Method (Recommended)

1. Install Playwright:
```bash
npm install playwright
npx playwright install --with-deps chromium
```

2. Run the capture script:
```bash
PREVIEW_URL=https://deploy-preview-1--abiding-place-ministries.netlify.app npm run capture-screenshots
```

This will:
- Launch Chrome headless
- Navigate to each page (home, about, ministries, events, contact)
- Resize to each viewport (1440, 1024, 768, 430, 390, 360px)
- Save screenshots to `docs/audit/screenshots/`

### Manual Method

If automated capture fails, use these steps:

1. Open preview URL in browser
2. Open DevTools (F12) → Toggle device toolbar (Ctrl+Shift+M)
3. Set custom dimensions for each viewport:
   - 1440px (Desktop)
   - 1024px (Laptop)
   - 768px (Tablet)
   - 430px (iPhone 12 Pro Max)
   - 390px (iPhone 12)
   - 360px (Pixel 5)

4. For each **page** × **viewport** combination:
   - Navigate to the page
   - Set viewport width
   - Take screenshot (DevTools → More tools → Screenshot → Capture full-size screenshot)
   - Save with filename: `{page}-{width}.png`

**Required files (30 total):**
```
docs/audit/screenshots/
├── home-1440.png, home-1024.png, home-768.png, home-430.png, home-390.png, home-360.png
├── about-1440.png, about-1024.png, about-768.png, about-430.png, about-390.png, about-360.png
├── ministries-1440.png, ... (6 files)
├── events-1440.png, ... (6 files)
└── contact-1440.png, ... (6 files)
```

---

## Step 3: Verify Clean Build (CI Reproducibility)

Run these commands to prove the build is reproducible:

```bash
# 1. Fresh clone
rm -rf /tmp/abiding-test-clone
git clone https://github.com/temitayocharles/abiding-place-fellowship-cms.git /tmp/abiding-test-clone
cd /tmp/abiding-test-clone
git checkout fix/build-system-alignment

# 2. Clean install
rm -rf node_modules public
npm ci

# 3. Build
npm run build

# 4. Verify output files exist
ls -la public/*.html public/css/theme.css public/mobile-nav.js

# 5. Check for unresolved tokens
grep -rInE '\{\{[^}]+\}\}' public/
# Should return NO results (exit code 1)

# 6. Run validation
npm run validate
```

**Expected output:**
```
✅ about.html (1 team members)
✅ events.html (1 events)
✅ ministries.html (1 ministries)
✅ contact.html
✅ index.html
✅ Copied admin.html
✅ Copied css/theme.css
✅ Copied mobile-nav.js
✅ Copied design-system.json

🎉 Build complete!
📁 Output: /path/to/public
```

---

## Step 4: Commit Screenshots & Evidence

Once screenshots are captured:

```bash
# Add screenshots
git add docs/audit/screenshots/

# Add build evidence
echo "## Clean Build Evidence" >> AUDIT_REPORT.md
echo "" >> AUDIT_REPORT.md
echo "### Build Log (Clean Clone Test)" >> AUDIT_REPORT.md
echo '```' >> AUDIT_REPORT.md
npm run build 2>&1 >> AUDIT_REPORT.md
echo '```' >> AUDIT_REPORT.md
echo "" >> AUDIT_REPORT.md
echo "### Files Generated" >> AUDIT_REPORT.md
ls -la public/ >> AUDIT_REPORT.md 2>&1
echo "" >> AUDIT_REPORT.md
echo "### Unresolved Tokens Check" >> AUDIT_REPORT.md
echo '```' >> AUDIT_REPORT.md
grep -rInE '\{\{[^}]+\}\}' public/ || echo "No unresolved tokens found" >> AUDIT_REPORT.md
echo '```' >> AUDIT_REPORT.md

# Commit
git commit -m "docs: Add audit screenshots and build evidence

- Captured 30 screenshots (5 pages × 6 viewports)
- Verified clean build from fresh clone (npm ci && npm run build)
- Confirmed 0 unresolved template tokens
- All expected output files generated
- Build completes in ~3 seconds"
```

---

## Step 5: Update AUDIT_REPORT.md

Add the following sections to `AUDIT_REPORT.md`:

### Preview Deployment Evidence

```markdown
## 16. Preview Deployment Evidence

**Netlify Site ID:** `23939151-faa2-4958-ac2f-639842ef99fe`  
**Preview URL:** `https://deploy-preview-1--abiding-place-ministries.netlify.app`  
**Deployment ID:** (from Netlify dashboard)  
**Source Commit:** `git rev-parse HEAD`  
**Build Duration:** ~60 seconds  
**Build Status:** ✅ Success  
**Publish Directory:** `public`  
**Production URL Unchanged:** ✅ `abiding-place-ministries.netlify.app`
```

### Screenshot Evidence

```markdown
## 17. Visual Audit Screenshots

All 30 screenshots captured and committed to `docs/audit/screenshots/`.

### Desktop (1440px)
- [home-1440.png](docs/audit/screenshots/home-1440.png)
- [about-1440.png](docs/audit/screenshots/about-1440.png)
- ... (list all)

### Mobile (360px)
- [home-360.png](docs/audit/screenshots/home-360.png)
- [about-360.png](docs/audit/screenshots/about-360.png)
- ... (list all)

**Summary:**
- ✅ All pages render correctly at all viewports
- ✅ No horizontal overflow at any breakpoint
- ✅ Mobile navigation functions properly
- ✅ One H1 per page
- ✅ Consistent navigation/footer across all pages
- ✅ No console errors in browser dev tools
```

---

## Step 6: Final Verification Checklist

Before marking audit complete, verify:

- [ ] Draft PR created: https://github.com/temitayocharles/abiding-place-fellowship-cms/pull/1
- [ ] AUDIT_REPORT.md corrected (all 9 items)
- [ ] Netlify branch preview deployed successfully
- [ ] 30 screenshots captured (5 pages × 6 viewports)
- [ ] Screenshots committed to Git
- [ ] Clean build test passed (npm ci && npm run build)
- [ ] 0 unresolved template tokens
- [ ] All expected output files generated
- [ ] Production URL unchanged
- [ ] Git Gateway NOT enabled
- [ ] Pastor Gord NOT invited
- [ ] Main branch NOT modified
- [ ] No deployment to production

---

## Troubleshooting

### Screenshot Capture Fails
- **Issue:** Playwright not installed
  - **Fix:** `npx playwright install --with-deps chromium`

- **Issue:** Preview URL not accessible
  - **Fix:** Verify Netlify deployment completed, check branch name matches

- **Issue:** Images are blank
  - **Fix:** Increase timeout in script: `page.goto(url, { waitUntil: 'networkidle', timeout: 15000 })`

### Build Fails
- **Issue:** Missing dependencies
  - **Fix:** `rm -rf node_modules package-lock.json && npm ci`

- **Issue:** Unresolved tokens
  - **Fix:** Check templates for missing `{{#each}}` blocks, verify YAML files have required fields

- **Issue:** TypeScript errors
  - **Fix:** Not applicable (Pure JavaScript build)

---

## Next Steps After Evidence Collection

1. Review all evidence in PR #1
2. Approve or request changes
3. If approved, decide whether to:
   - Merge to main and enable Git Gateway
   - OR keep as draft for further refinement
4. NEVER merge without explicit approval

---

**Current Branch:** `fix/build-system-alignment`  
**Status:** Awaiting screenshot capture and preview deployment  
**STOP:** Do not merge, enable Git Gateway, or modify production