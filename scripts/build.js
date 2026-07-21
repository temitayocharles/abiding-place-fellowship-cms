const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const { marked } = require('marked');

// Custom Handlebars-like template engine
function renderTemplate(template, data) {
  let output = template;

  // Step 1: Process {{#each collection}} blocks
  output = output.replace(/\{\{#each ([\w]+)\}\}([\s\S]*?)\{\{\/each\}\}/g, (match, collectionName, innerTemplate) => {
    const items = data[collectionName] || [];
    if (!items.length) return '';
    
    return items.map(item => {
      // Create a merged context (item + parent data)
      const context = { ...data, ...item, parent: data };
      
      // Recursively process nested structures in this item's context
      return processTemplate(innerTemplate, context);
    }).join('');
  });

  // Step 2: Process {{#if condition}} blocks
  output = output.replace(/\{\{#if ([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, condition, content) => {
    const value = getNestedValue(data, condition);
    if (Array.isArray(value)) {
      return value.length > 0 ? processTemplate(content, data) : '';
    }
    return value ? processTemplate(content, data) : '';
  });

  // Step 3: Replace simple {{variable}} placeholders
  Object.keys(data).forEach(key => {
    const value = data[key];
    if (Array.isArray(value) || typeof value === 'object') return; // Skip in simple replacement
    const placeholder = `{{${key}}}`;
    output = output.split(placeholder).join(String(value || ''));
  });

  // Step 4: Process markdown
  output = output.replace(/\{\{!markdown ([\s\S]*?)\}\}/g, (match, md) => marked.parse(md));

  return output;
}

// Helper to get nested values (e.g., "service_times.0.day")
function getNestedValue(obj, path) {
  return path.split('.').reduce((current, key) => current && current[key], obj);
}

// Recursive template processor
function processTemplate(template, data) {
  let output = template;

  // Replace {{this.variable}} with item's variable
  output = output.replace(/\{\{this\.([\w]+)\}\}/g, (match, key) => {
    return data[key] || '';
  });

  // Replace plain {{variable}} with item's variable if exists, else parent
  output = output.replace(/\{\{([\w.]+)\}\}/g, (match, path) => {
    const value = getNestedValue(data, path);
    return Array.isArray(value) ? JSON.stringify(value) : (value || '');
  });

  // Handle {{#if this.variable}}
  output = output.replace(/\{\{#if this\.([\w]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
    return data[key] ? processTemplate(content, data) : '';
  });

  // Handle {{#if variable}}
  output = output.replace(/\{\{#if ([\w.]+)\}\}([\s\S]*?)\{\{\/if\}\}/g, (match, key, content) => {
    const value = getNestedValue(data, key);
    if (Array.isArray(value)) {
      return value.length > 0 ? processTemplate(content, data) : '';
    }
    return value ? processTemplate(content, data) : '';
  });

  return output;
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
  
  fs.mkdirSync(PUBLIC_DIR, { recursive: true });

  const siteConfig = loadYaml(path.join(CONFIG_DIR, 'site.yaml')) || {};
  const contactConfig = loadYaml(path.join(CONFIG_DIR, 'contact.yaml')) || {};
  
  const siteName = siteConfig.name || 'Abiding Place Fellowship';
  const description = siteConfig.description || 'A Christian fellowship in Shelburne, Ontario';
  const { phone, address, email, service_times = [], venue, entrance, cell } = contactConfig;

  // For pages that have hand-edited static versions, copy those instead of building from templates
  // The following pages have rich hand-edited content that should not be overwritten by CMS templates:
  const staticHtmlPages = ['about.html', 'events.html', 'ministries.html', 'contact.html', 'index.html'];
  staticHtmlPages.forEach(page => {
    const staticSrc = path.join(ROOT, page);
    if (fs.existsSync(staticSrc)) {
      // Use the hand-edited static version, but still copy to public/
      fs.copyFileSync(staticSrc, path.join(PUBLIC_DIR, page));
      console.log(`✅ Copied static ${page} (hand-edited version)`);
    } else {
      // Fall back to template build if no static version exists
      console.log(`⚠️  No static ${page} found, using template build`);
    }
  });

  const staticFiles = ['admin.html', 'css/theme.css', 'mobile-nav.js', 'design-system.json',
    'our-friends.html', 'missions.html', 'photos.html', 'our-faith.html', 'blog.html'];
  staticFiles.forEach(file => {
    const src = path.join(ROOT, file);
    if (fs.existsSync(src)) {
      const dest = path.join(PUBLIC_DIR, file);
      fs.mkdirSync(path.dirname(dest), { recursive: true });
      fs.copyFileSync(src, dest);
      console.log(`✅ Copied ${file}`);
    }
  });

  // Copy images directory
  const imagesSrc = path.join(ROOT, 'images');
  if (fs.existsSync(imagesSrc)) {
    const imagesDest = path.join(PUBLIC_DIR, 'images');
    fs.cpSync(imagesSrc, imagesDest, { recursive: true });
    console.log('✅ Copied images/');
  }

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