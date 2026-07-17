const fs = require('fs');
const path = require('path');
const yaml = require('yaml');
const { marked } = require('marked');

// Project root
const ROOT_DIR = path.resolve(__dirname, '..');
const CONFIG_DIR = path.join(ROOT_DIR, 'config');
const CONTENT_DIR = path.join(ROOT_DIR, 'content');
const OUTPUT_DIR = path.join(ROOT_DIR, 'public');

// Helper to read YAML file
function readYaml(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  return yaml.parse(content);
}

// Helper to read template
function readTemplate(templateName) {
  return fs.readFileSync(path.join(ROOT_DIR, 'templates', templateName), 'utf8');
}

// Helper to create HTML with injected content
function createPage(templateName, data) {
  let template = readTemplate(templateName);
  
  // Inject content
  Object.keys(data).forEach(key => {
    const placeholder = `{{${key}}}`;
    const value = data[key];
    
    if (typeof value === 'object' && !Array.isArray(value)) {
      // Convert nested objects to JSON for complex fields
      template = template.replace(placeholder, `<div data-json='${JSON.stringify(value)}'>${JSON.stringify(value)}</div>`);
    } else if (Array.isArray(value)) {
      // Handle lists (e.g., service times)
      const listHtml = value.map(item => {
        if (typeof item === 'object') {
          const rows = Object.entries(item).map(([k, v]) => `<div><strong>${k}:</strong> ${v}</div>`).join('');
          return `<div class='list-item'>${rows}</div>`;
        }
        return `<div>${item}</div>`;
      }).join('');
      template = template.replace(placeholder, `<div class='list-container'>${listHtml}</div>`);
    } else if (typeof value === 'string' && value.includes('\n')) {
      // Handle multi-line text (markdown support)
      template = template.replace(placeholder, marked.parse(value));
    } else {
      template = template.replace(placeholder, value || '');
    }
  });
  
  return template;
}

// Build all pages
async function build() {
  console.log('🏗️  Building pages from CMS content...\n');
  
  // Ensure output directory exists
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  
  // 1. Build Contact Page
  try {
    const contactData = readYaml(path.join(CONFIG_DIR, 'contact.yaml'));
    const siteData = readYaml(path.join(CONFIG_DIR, 'site.yaml'));
    
    const contactContent = {
      phone: contactData.phone,
      cell: contactData.cell,
      email: contactData.email,
      address: contactData.address,
      service_times: contactData.service_times,
      site_name: siteData.name || 'Abiding Place Fellowship'
    };
    
    const contactHtml = createPage('contact.html', contactContent);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'contact.html'), contactHtml);
    console.log('✅ Generated contact.html');
  } catch (error) {
    console.error('❌ Error building contact.html:', error.message);
  }
  
  // 2. Build Team Members (About Page)
  try {
    const teamDir = path.join(CONTENT_DIR, 'team');
    if (fs.existsSync(teamDir)) {
      const teamFiles = fs.readdirSync(teamDir).filter(f => f.endsWith('.yaml'));
      const teamMembers = teamFiles.map(file => {
        const content = readYaml(path.join(teamDir, file));
        return content;
      });
      
      const teamContent = {
        members: teamMembers,
        team_count: teamMembers.length
      };
      
      const aboutHtml = createPage('about.html', teamContent);
      fs.writeFileSync(path.join(OUTPUT_DIR, 'about.html'), aboutHtml);
      console.log(`✅ Generated about.html with ${teamMembers.length} team members`);
    } else {
      console.log('⚠️  No team content found in content/team/');
    }
  } catch (error) {
    console.error('❌ Error building about.html:', error.message);
  }
  
  // 3. Build Events Page
  try {
    const eventsDir = path.join(CONTENT_DIR, 'events');
    if (fs.existsSync(eventsDir)) {
      const eventFiles = fs.readdirSync(eventsDir).filter(f => f.endsWith('.yaml'));
      const events = eventFiles.map(file => {
        const content = readYaml(path.join(eventsDir, file));
        return content;
      });
      
      const eventsContent = {
        events: events,
        event_count: events.length
      };
      
      const eventsHtml = createPage('events.html', eventsContent);
      fs.writeFileSync(path.join(OUTPUT_DIR, 'events.html'), eventsHtml);
      console.log(`✅ Generated events.html with ${events.length} events`);
    } else {
      console.log('⚠️  No events content found in content/events/');
    }
  } catch (error) {
    console.error('❌ Error building events.html:', error.message);
  }
  
  // 4. Build Ministries Page
  try {
    const ministriesDir = path.join(CONTENT_DIR, 'ministries');
    if (fs.existsSync(ministriesDir)) {
      const ministryFiles = fs.readdirSync(ministriesDir).filter(f => f.endsWith('.yaml'));
      const ministries = ministryFiles.map(file => {
        const content = readYaml(path.join(ministriesDir, file));
        return content;
      });
      
      const ministriesContent = {
        ministries: ministries,
        ministry_count: ministries.length
      };
      
      const ministriesHtml = createPage('ministries.html', ministriesContent);
      fs.writeFileSync(path.join(OUTPUT_DIR, 'ministries.html'), ministriesHtml);
      console.log(`✅ Generated ministries.html with ${ministries.length} ministries`);
    } else {
      console.log('⚠️  No ministries content found in content/ministries/');
    }
  } catch (error) {
    console.error('❌ Error building ministries.html:', error.message);
  }
  
  // 5. Build Index (Home) Page - combines contact + events
  try {
    const contactData = readYaml(path.join(CONFIG_DIR, 'contact.yaml'));
    const siteData = readYaml(path.join(CONFIG_DIR, 'site.yaml'));
    
    const eventsDir = path.join(CONTENT_DIR, 'events');
    let events = [];
    if (fs.existsSync(eventsDir)) {
      const eventFiles = fs.readdirSync(eventsDir).filter(f => f.endsWith('.yaml'));
      events = eventFiles.map(file => readYaml(path.join(eventsDir, file)));
    }
    
    const homeContent = {
      site_name: siteData.name || 'Abiding Place Fellowship',
      description: siteData.description || 'A Christian fellowship in Shelburne',
      phone: contactData.phone,
      address: contactData.address,
      service_times: contactData.service_times,
      events: events.slice(0, 3), // Show latest 3 events on home
      event_count: events.length
    };
    
    const homeHtml = createPage('index.html', homeContent);
    fs.writeFileSync(path.join(OUTPUT_DIR, 'index.html'), homeHtml);
    console.log('✅ Generated index.html (home page)');
  } catch (error) {
    console.error('❌ Error building index.html:', error.message);
  }
  
  // 6. Copy admin.html, CSS, JS, and assets to public
  try {
    const filesToCopy = ['admin.html', 'css/theme.css', 'mobile-nav.js', 'design-system.json'];
    filesToCopy.forEach(file => {
      const src = path.join(ROOT_DIR, file);
      const dest = path.join(OUTPUT_DIR, file);
      if (fs.existsSync(src)) {
        fs.mkdirSync(path.dirname(dest), { recursive: true });
        fs.copyFileSync(src, dest);
        console.log(`✅ Copied ${file}`);
      }
    });
    
    // Copy assets/uploads if exists
    const assetsDir = path.join(ROOT_DIR, 'assets');
    if (fs.existsSync(assetsDir)) {
      const destAssetsDir = path.join(OUTPUT_DIR, 'assets');
      fs.cpSync(assetsDir, destAssetsDir, { recursive: true });
      console.log('✅ Copied assets/');
    }
  } catch (error) {
    console.error('❌ Error copying static files:', error.message);
  }
  
  console.log('\n🎉 Build complete! Generated files in /public/');
  console.log('📁 Output directory:', OUTPUT_DIR);
}

// Run build
build().catch(error => {
  console.error('💥 Build failed:', error);
  process.exit(1);
});