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

console.log('✅ Reserved /admin/ for the CMS editor');
console.log('✅ Administration dashboard available at /manage.html');
