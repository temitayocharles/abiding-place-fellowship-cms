const fs = require('fs');
const path = require('path');

const publicDir = path.resolve(__dirname, '..', 'public');
const legacyDashboard = path.join(publicDir, 'admin.html');
const managementDashboard = path.join(publicDir, 'manage.html');
const editor = path.join(publicDir, 'admin', 'index.html');
const homePage = path.join(publicDir, 'index.html');

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

if (!fs.existsSync(homePage)) {
  throw new Error('Homepage output is missing: public/index.html');
}

const identityTokenRedirect = `<script>
(function () {
  var hash = window.location.hash || '';
  var identityToken = /^#(?:invite_token|confirmation_token|recovery_token|email_change_token|access_token)=/i.test(hash);
  if (identityToken && window.location.pathname !== '/admin/' && window.location.pathname !== '/admin') {
    window.location.replace('/admin/' + hash);
  }
})();
</script>`;

let homeHtml = fs.readFileSync(homePage, 'utf8');
if (!homeHtml.includes('identityToken')) {
  homeHtml = homeHtml.replace(/<head([^>]*)>/i, `<head$1>${identityTokenRedirect}`);
  fs.writeFileSync(homePage, homeHtml);
}

const redirects = [
  '/admin /admin/index.html 200!',
  '/admin/ /admin/index.html 200!',
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
  '/admin',
  '  X-Robots-Tag: noindex, nofollow',
  '  Cache-Control: no-store',
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
console.log('✅ Identity email tokens forward from the homepage to /admin/');
console.log('✅ Emitted portable Netlify routing and security rules');
