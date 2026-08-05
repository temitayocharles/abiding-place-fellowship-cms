const fs = require('fs');
const path = require('path');

const publicDir = path.resolve(__dirname, '..', 'public');
const legacyDashboard = path.join(publicDir, 'admin.html');
const managementDashboard = path.join(publicDir, 'manage.html');
const editor = path.join(publicDir, 'admin', 'index.html');

if (!fs.existsSync(editor)) {
  throw new Error('CMS editor output is missing: public/admin/index.html');
}

if (fs.existsSync(legacyDashboard)) {
  fs.copyFileSync(legacyDashboard, managementDashboard);
  fs.rmSync(legacyDashboard);
}

if (!fs.existsSync(managementDashboard)) {
  throw new Error('Administration dashboard output is missing: public/manage.html');
}

const redirects = [
  '/admin /admin/ 301!',
  '/admin.html /admin/ 301!',
  '/editor.html /admin/ 301!',
  '/manage /manage.html 301!',
  '',
].join('\n');

const headers = [
  '/*',
  '  X-Content-Type-Options: nosniff',
  '  X-Frame-Options: SAMEORIGIN',
  '  Referrer-Policy: strict-origin-when-cross-origin',
  '  Permissions-Policy: camera=(), microphone=(), geolocation=()',
  '',
  '/admin/',
  '  X-Robots-Tag: noindex, nofollow',
  '  Cache-Control: no-store',
  '',
  '/admin/*',
  '  X-Robots-Tag: noindex, nofollow',
  '  Cache-Control: no-store',
  '',
  '/assets/*',
  '  Cache-Control: public, max-age=31536000, immutable',
  '',
].join('\n');

fs.writeFileSync(path.join(publicDir, '_redirects'), redirects);
fs.writeFileSync(path.join(publicDir, '_headers'), headers);

console.log('✅ Reserved /admin/ for the CMS editor');
console.log('✅ Administration dashboard available at /manage.html');
console.log('✅ Emitted portable Netlify routing and security rules');
