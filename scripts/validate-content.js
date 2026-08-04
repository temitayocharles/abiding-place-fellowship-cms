const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const ROOT = path.resolve(__dirname, '..');
let failures = 0;
let warnings = 0;

function load(relativePath) {
  const filePath = path.join(ROOT, relativePath);
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing ${relativePath}`);
    failures += 1;
    return {};
  }
  try {
    return yaml.parse(fs.readFileSync(filePath, 'utf8')) || {};
  } catch (error) {
    console.error(`❌ Invalid YAML in ${relativePath}: ${error.message}`);
    failures += 1;
    return {};
  }
}

function requireValue(object, key, context) {
  if (object[key] === undefined || object[key] === null || object[key] === '') {
    console.error(`❌ ${context} is missing ${key}`);
    failures += 1;
  }
}

function validateArray(items, context, requiredFields) {
  if (!Array.isArray(items) || items.length === 0) {
    console.error(`❌ ${context} must contain at least one item`);
    failures += 1;
    return;
  }
  items.forEach((item, index) => requiredFields.forEach(field => requireValue(item, field, `${context}[${index}]`)));
}

console.log('🔍 Validating canonical CMS content...');

const site = load('config/site.yaml');
['name', 'description', 'founded', 'email'].forEach(key => requireValue(site, key, 'config/site.yaml'));

const contact = load('config/contact.yaml');
['phone', 'email', 'venue', 'address', 'entrance'].forEach(key => requireValue(contact, key, 'config/contact.yaml'));
if (!Array.isArray(contact.service_times) || contact.service_times.length < 1) {
  console.error('❌ config/contact.yaml requires service_times');
  failures += 1;
}

const gatherings = load('content/site/weekly-gatherings.yaml');
validateArray(gatherings.gatherings, 'weekly gatherings', ['name', 'day', 'time', 'venue', 'entrance']);

const leadership = load('content/site/leadership.yaml');
validateArray(leadership.leadership, 'leadership', ['name', 'role', 'bio']);

const ministries = load('content/site/ministries.yaml');
validateArray(ministries.ministries, 'ministries', ['name', 'summary']);

const announcements = load('content/site/announcements.yaml');
if (!Array.isArray(announcements.announcements)) {
  console.error('❌ announcements must be a list');
  failures += 1;
} else {
  announcements.announcements.forEach((item, index) => {
    if (item.published !== false) {
      ['title', 'description'].forEach(field => requireValue(item, field, `announcements[${index}]`));
    }
  });
}

if (site.founded !== 2004) {
  console.warn(`⚠️  Confirm founding year: configured as ${site.founded}`);
  warnings += 1;
}
if (/prunefolk/i.test(contact.venue || '')) {
  console.error('❌ Venue contains obsolete placeholder value');
  failures += 1;
}

if (failures) {
  console.error(`\n❌ Validation failed with ${failures} error(s) and ${warnings} warning(s).`);
  process.exit(1);
}
console.log(`✅ Canonical content is valid (${warnings} warning(s)).`);
