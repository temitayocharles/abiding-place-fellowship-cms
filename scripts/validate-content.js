const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

// Project root
const ROOT_DIR = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT_DIR, 'content');
const CONFIG_DIR = path.join(ROOT_DIR, 'config');

let hasErrors = false;
let warnings = 0;
let info = 0;

function checkFile(filePath, rules) {
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Missing: ${filePath}`);
    hasErrors = true;
    return null;
  }

  const content = fs.readFileSync(filePath, 'utf8');
  const data = yaml.parse(content);
  
  if (rules.requiredFields) {
    for (const field of rules.requiredFields) {
      if (!data[field]) {
        console.error(`❌ ${filePath} missing required field: "${field}"`);
        hasErrors = true;
      }
    }
  }

  if (rules.checkNested) {
    for (const [key, fields] of Object.entries(rules.checkNested)) {
      if (data[key] && Array.isArray(data[key])) {
        data[key].forEach((item, idx) => {
          for (const field of fields) {
            if (!item[field]) {
              warnings++;
              console.warn(`⚠️  ${filePath}[${key}][${idx}] missing optional field "${field}"`);
            }
          }
        });
      }
    }
  }

  return data;
}

console.log('🔍 Validating team, event, and ministry content...\n');

// Check team members
const teamDir = path.join(CONTENT_DIR, 'team');
if (fs.existsSync(teamDir)) {
  const teamFiles = fs.readdirSync(teamDir).filter(f => f.endsWith('.yaml'));
  if (teamFiles.length === 0) {
    console.log('ℹ️  No team members yet (OK)');
    info++;
  } else {
    console.log(`📋 Checking ${teamFiles.length} team members...`);
    teamFiles.forEach(file => {
      const data = checkFile(path.join(teamDir, file), {
        requiredFields: ['name', 'role'],
        checkNested: {}
      });
      if (data && data.bio) info++;
    });
    console.log(`✅ Team validation passed (${teamFiles.length} members)\n`);
  }
} else {
  console.log('ℹ️  content/team/ directory not found (OK for initial build)\n');
  info++;
}

// Check events
const eventsDir = path.join(CONTENT_DIR, 'events');
if (fs.existsSync(eventsDir)) {
  const eventFiles = fs.readdirSync(eventsDir).filter(f => f.endsWith('.yaml'));
  if (eventFiles.length === 0) {
    console.log('ℹ️  No events yet (OK)');
    info++;
  } else {
    console.log(`📅 Checking ${eventFiles.length} events...`);
    eventFiles.forEach(file => {
      const data = checkFile(path.join(eventsDir, file), {
        requiredFields: ['title', 'date', 'description']
      });
    });
    console.log(`✅ Events validation passed (${eventFiles.length} events)\n`);
  }
} else {
  console.log('ℹ️  content/events/ directory not found (OK)\n');
  info++;
}

// Check ministries
const ministriesDir = path.join(CONTENT_DIR, 'ministries');
if (fs.existsSync(ministriesDir)) {
  const ministryFiles = fs.readdirSync(ministriesDir).filter(f => f.endsWith('.yaml'));
  if (ministryFiles.length === 0) {
    console.log('ℹ️  No ministries yet (OK)');
    info++;
  } else {
    console.log(`🏛️  Checking ${ministryFiles.length} ministries...`);
    ministryFiles.forEach(file => {
      const data = checkFile(path.join(ministriesDir, file), {
        requiredFields: ['name', 'description']
      });
    });
    console.log(`✅ Ministries validation passed (${ministryFiles.length} ministries)\n`);
  }
} else {
  console.log('ℹ️  content/ministries/ directory not found (OK)\n');
  info++;
}

// Check config files
console.log('⚙️  Checking configuration files...');
const siteData = checkFile(path.join(CONFIG_DIR, 'site.yaml'), {
  requiredFields: ['name', 'email']
});
const contactData = checkFile(path.join(CONFIG_DIR, 'contact.yaml'), {
  requiredFields: ['phone', 'email', 'address', 'service_times'],
  checkNested: { service_times: ['day', 'time'] }
});
console.log('✅ Config validation passed\n');

// Summary
console.log('═══════════════════════════════════════');
console.log('SUMMARY:');
if (hasErrors) {
  console.error('❌ ERRORS found - Fix before deployment');
  process.exit(1);
} else if (warnings > 0) {
  console.log(`⚠️  ${warnings} warnings - Review recommended`);
  console.log(`ℹ️  ${info} info messages`);
} else {
  console.log('✅ All validations passed!');
  console.log(`ℹ️  ${info} info messages`);
}
console.log('═══════════════════════════════════════');