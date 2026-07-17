const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const { marked } = require('marked');

// Helper to replace Handlebars-style templates
function renderTemplate(template, data) {
  // Replace simple {{key}} variables
  Object.keys(data).forEach(key => {
    const value = data[key];
    const placeholder = `{{${key}}}`;
    
    if (typeof value === 'string') {
      template = template.split(placeholder).join(value || '');
    } else if (Array.isArray(value)) {
      // Will be handled by #each blocks
    } else {
      template = template.split(placeholder).join(JSON.stringify(value));
    }
  });

  // Handle {{#each}} blocks
  template = template.replace(/\{\{#each (\w+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, collectionName, innerTemplate) => {
    const items = data[collectionName] || [];
    if (!items.length) return '';
    
    return items.map((item, index) => {
      let rendered = innerTemplate;
      // Inject item-specific variables
      Object.keys(item).forEach(key => {
        rendered = rendered.split(`{{${key}}}`).join(item[key] || '');
      });
      // Inject parent-level variables
      Object.keys(data).forEach(key => {
        rendered = rendered.split(`{{${key}}}`).join(data[key] || '');
      });
      // Handle nested {{#if}} blocks
      rendered = rendered.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (m, cond, content) => {
        return item[cond] ? content : '';
      });
      // Handle {{substring}} helper
      rendered = rendered.replace(/\{\{substring "(\w+)" (\d) (\d)\}\}/g, (m, str, start, len) => {
        return str.substring(start, start + parseInt(len));
      });
      // Handle {{substring item key}} syntax
      rendered = rendered.replace(/\{\{substring ([^\s]+) ([^\s]+) ([^\s]+)\}\}/g, (m, obj, prop, len) => {
        const value = item[prop] || '';
        return value.substring(0, parseInt(len));
      });
      return rendered;
    }).join('');
  });

  // Handle {{#if}} blocks
  template = template.replace(/\{\{#if (\w+)\}\}([\s\S]*?)\{{\/if\}\}/g, (match, condition, content) => {
    const value = data[condition];
    return (value && value.length > 0) ? content : '';
  });

  // Process markdown in text fields
  template = template.replace(/\{\{!markdown (.*?)\}\}/g, (match, mdContent) => {
    return marked.parse(mdContent);
  });

  return template;
}

// Project directories
const ROOT = path.resolve(__dirname, '..');
const CONFIG_DIR = path.join(ROOT, 'config');
const CONTENT_DIR = path.join(ROOT, 'content');
const PUBLIC_DIR = path.join(ROOT, 'public');
const TEMPLATES_DIR = path.join(ROOT, 'templates');

function loadYaml(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return yaml.parse(fs.readFileSync(filePath, 'utf8'));
}

function loadCollection(folderPath) {
  if (!fs.existsSync(folderPath)) return [];
  const files = fs.readdirSync(folderPath).filter(f => f.endsWith('.yaml'));
  return files.map(f => loadYaml(path.join(folderPath, f))).filter(Boolean);
}

function buildPage(templateName, data) {
  const template = fs.readFileSync(path.join(TEMPLATES_DIR, templateName), 'utf8');
  return renderTemplate(template, data);
}

async function build() {
  console.log('🏗️  Building pages from CMS content...\n');
  
  // Ensure public directory exists
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  // Load shared data
  const siteConfig = loadYaml(path.join(CONFIG_DIR, 'site.yaml')) || {};
  const contactConfig = loadYaml(path.join(CONFIG_DIR, 'contact.yaml')) || {};
  
  const siteName = siteConfig.name || 'Abiding Place Fellowship';
  const description = siteConfig.description || 'A Christian fellowship in Shelburne, Ontario';
  const { phone, address, email, service_times = [] } = contactConfig;

  // Build Team/About page
  const teamMembers = loadCollection(path.join(CONTENT_DIR, 'team'));
  const aboutHtml = buildPage('about.html', {
    site_name: siteName,
    members: teamMembers,
    phone,
    email
  });
  fs.writeFileSync(path.join(PUBLIC_DIR, 'about.html'), aboutHtml);
  console.log(`✅ about.html (${teamMembers.length} team members)`);

  // Build Events page
  const events = loadCollection(path.join(CONTENT_DIR, 'events'));
  const eventsHtml = buildPage('events.html', {
    site_name: siteName,
    events: events.sort((a, b) => new Date(a.date) - new Date(b.date))
  });
  fs.writeFileSync(path.join(PUBLIC_DIR, 'events.html'), eventsHtml);
  console.log(`✅ events.html (${events.length} events)`);

  // Build Ministries page
  const ministries = loadCollection(path.join(CONTENT_DIR, 'ministries'));
  const ministriesHtml = buildPage('ministries.html', {
    site_name: siteName,
    ministries: ministries
  });
  fs.writeFileSync(path.join(PUBLIC_DIR, 'ministries.html'), ministriesHtml);
  console.log(`✅ ministries.html (${ministries.length} ministries)`);

  // Build Contact page
  const contactHtml = buildPage('contact.html', {
    site_name: siteName,
    phone,
    cell: contactConfig.cell || '',
    email,
    address,
    venue: contactConfig.venue || '',
    entrance: contactConfig.entrance || '',
    service_times
  });
  fs.writeFileSync(path.join(PUBLIC_DIR, 'contact.html'), contactHtml);
  console.log('✅ contact.html');

  // Build Home page
  const homeEvents = events.filter(e => e.show_on_home !== false).slice(0, 3);
  const homeHtml = buildPage('index.html', {
    site_name: siteName,
    description,
    phone,
    address,
    email,
    service_times,
    events: homeEvents
  });
  fs.writeFileSync(path.join(PUBLIC_DIR, 'index.html'), homeHtml);
  console.log('✅ index.html');

  // Copy static assets
  const staticFiles = ['admin.html', 'css/theme.css', 'mobile-nav.js', 'design-system.json'];
  staticFiles.forEach(file => {
    const src = path.join(ROOT, file);
    if (fs.existsSync(src)) {
      const dest = path.join(PUBLIC_DIR, file);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
      console.log(`✅ Copied ${file}`);
    }
  });

  // Copy assets folder
  const assetsSrc = path.join(ROOT, 'assets');
  if (fs.existsSync(assetsSrc)) {
    const assetsDest = path.join(PUBLIC_DIR, 'assets');
    fs.cpSync(assetsSrc, assetsDest, { recursive: true });
    console.log('✅ Copied assets/');
  }

  console.log('\n🎉 Build complete!');
  console.log('📁 Output:', PUBLIC_DIR);
}

build().catch(err => {
  console.error('💥 Build failed:', err);
  process.exit(1);
});