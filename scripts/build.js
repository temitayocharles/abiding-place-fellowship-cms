const fs = require('fs');
const path = require('path');
const yaml = require('yaml');

const ROOT = path.resolve(__dirname, '..');
const PUBLIC = path.join(ROOT, 'public');
const CONFIG = path.join(ROOT, 'config');
const SITE_CONTENT = path.join(ROOT, 'content', 'site');

function readYaml(filePath, fallback = {}) {
  if (!fs.existsSync(filePath)) return fallback;
  return yaml.parse(fs.readFileSync(filePath, 'utf8')) || fallback;
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function cleanPublic() {
  fs.rmSync(PUBLIC, { recursive: true, force: true });
  fs.mkdirSync(PUBLIC, { recursive: true });
}

function copyFile(relativePath, destination = relativePath) {
  const source = path.join(ROOT, relativePath);
  if (!fs.existsSync(source)) return;
  const target = path.join(PUBLIC, destination);
  fs.mkdirSync(path.dirname(target), { recursive: true });
  fs.copyFileSync(source, target);
}

function copyDirectory(relativePath, destination = relativePath) {
  const source = path.join(ROOT, relativePath);
  if (!fs.existsSync(source)) return;
  fs.cpSync(source, path.join(PUBLIC, destination), { recursive: true });
}

function replaceFirst(html, pattern, replacement, label) {
  if (!pattern.test(html)) {
    console.warn(`⚠️  Build marker not found: ${label}`);
    return html;
  }
  pattern.lastIndex = 0;
  return html.replace(pattern, replacement);
}

function renderGatheringCards(gatherings = [], contact = {}) {
  const colors = ['var(--accent)', 'var(--secondary)', 'var(--primary)'];
  return gatherings.map((item, index) => {
    const location = [item.venue || contact.venue, item.entrance || contact.entrance]
      .filter(Boolean)
      .join(', ');
    const topic = index === 0
      ? ''
      : item.current_topic && item.current_topic !== 'Confirm with church'
        ? ` Current study: ${escapeHtml(item.current_topic)}.`
        : ' Contact the church for the current study or seasonal changes.';
    return `<div class="event-card" style="border-left-color:${colors[index % colors.length]}"><span class="event-date">${escapeHtml(item.day)}s • ${escapeHtml(item.time)}</span><h3 class="event-title">${escapeHtml(item.name)}</h3><p class="event-location">${escapeHtml(location)}</p><p>${index === 0 ? 'Worship, Biblical teaching, prayer and fellowship.' : 'Scripture study, prayer and fellowship.'}${topic}</p></div>`;
  }).join('');
}

function renderAnnouncementSection(announcements = []) {
  const published = announcements.filter(item => item.published !== false && item.title);
  if (!published.length) return '';

  const cards = published.map(item => {
    const when = [item.date, item.time].filter(Boolean).join(' • ');
    return `<div class="event-card" style="border-left-color:var(--primary)"><span class="event-date">${escapeHtml(when || 'Current announcement')}</span><h3 class="event-title">${escapeHtml(item.title)}</h3><p class="event-location">${escapeHtml(item.location || '')}</p><p>${escapeHtml(item.description || '')}</p></div>`;
  }).join('');

  return `<section class="section section-white"><div class="container"><h2 style="text-align:center">Current Announcements</h2><p style="text-align:center;max-width:760px;margin:1rem auto 0">Updates published by the fellowship. Please contact the church if confirmation is needed.</p><div class="events-grid">${cards}</div></div></section>`;
}

function resolveMinistryImage(item) {
  const local = {
    'Children’s Ministry': 'images/ministries/kids-church.jpg',
    'Worship Ministry': 'images/worship/worship-service-1.jpg',
    'Women’s Ministry': 'images/ministries/womens-ministry.jpg',
    'Men’s Ministry': 'images/ministries/mens-ministry.jpg',
    'Bible Study and Prayer': 'images/interior/leadership-team.jpg',
    'Legion Ministry': 'images/ministries/legion-ministry.jpg',
    'Seniors Ministry': 'images/ministries/oaks-ministry.jpg',
    'Missions and Partnerships': 'images/missions/grenada-church.jpg'
  };
  return local[item.name] || item.photo || '';
}

function renderMinistryCards(ministries = []) {
  return ministries.map(item => {
    const photo = resolveMinistryImage(item);
    const image = photo
      ? `<img alt="${escapeHtml(item.name)} at Abiding Place Fellowship" loading="lazy" src="${escapeHtml(photo)}" style="width:100%;height:180px;object-fit:cover;border-radius:.75rem;margin-bottom:1rem"/>`
      : '<div class="ministry-icon" aria-hidden="true">✦</div>';
    const schedule = item.current_schedule
      ? `<p style="margin-top:1rem;color:var(--text-muted);font-size:.938rem"><strong>Schedule:</strong> ${escapeHtml(item.current_schedule)}</p>`
      : '';
    return `<div class="ministry-card">${image}<h3>${escapeHtml(item.name)}</h3><p>${escapeHtml(item.summary || item.description || '')}</p>${schedule}</div>`;
  }).join('');
}

function resolveLeadershipImage(item) {
  if (/Gord|Kate/i.test(item.name || '')) return 'images/pastor/pastor-gord-kate.jpg';
  if (/Leadership Team/i.test(item.name || '')) return 'images/interior/leadership-team.jpg';
  return item.photo || '';
}

function renderLeadershipCards(leaders = []) {
  return leaders.filter(item => item.verified !== false).map(item => {
    const imagePath = resolveLeadershipImage(item);
    const photo = imagePath
      ? `<img alt="${escapeHtml(item.name)}" class="team-photo" loading="lazy" src="${escapeHtml(imagePath)}" style="display:block;object-fit:cover"/>`
      : '<div class="team-photo" aria-hidden="true">AP</div>';
    return `<div class="team-card">${photo}<h3 class="team-name">${escapeHtml(item.name)}</h3><p class="team-role">${escapeHtml(item.role)}</p><p class="team-bio">${escapeHtml(item.bio || '')}</p></div>`;
  }).join('');
}

function renderHomeServiceCards(gatherings = [], contact = {}) {
  return gatherings.map((item, index) => {
    const color = index === 1 ? ' style="color:var(--secondary)"' : index === 2 ? ' style="color:var(--primary-dark)"' : '';
    const location = [item.venue || contact.venue, contact.address, item.entrance || contact.entrance].filter(Boolean).join(', ');
    const bullets = index === 0
      ? '<li>Bible-centred preaching and teaching</li><li>Worship and fellowship</li><li>Children’s ministry</li>'
      : '<li>Scripture study</li><li>Prayer and fellowship</li><li>Contact the church for the current study</li>';
    return `<div class="service-card"><div class="service-time"${color}>${escapeHtml(item.day)} ${escapeHtml(item.time)}</div><h3>${escapeHtml(item.name)}</h3><p><strong>Where:</strong> ${escapeHtml(location)}</p><ul style="list-style:none;margin-top:1rem;color:var(--neutral-600)">${bullets}</ul></div>`;
  }).join('');
}

function renderServiceFooter(serviceTimes = []) {
  return serviceTimes.map(item => `<p>${escapeHtml(item.day)}: ${escapeHtml(item.time)}</p>`).join('');
}

function applyContactDetails(html, contact = {}) {
  const phone = escapeHtml(contact.phone || '519-925-3651');
  const phoneHref = String(contact.phone || '519-925-3651').replace(/[^+\d]/g, '');
  const email = escapeHtml(contact.email || 'abidingplaceministries@sympatico.ca');
  const address = escapeHtml(contact.address || '167 Centre St, Shelburne, ON L9V 3R8');
  const venue = escapeHtml(contact.venue || 'Mel Lloyd Centre');
  const entrance = escapeHtml(contact.entrance || 'Door F');

  html = html
    .replaceAll('519-925-3651', phone)
    .replace(/tel:519[-\s]?925[-\s]?3651/g, `tel:${phoneHref}`)
    .replaceAll('abidingplaceministries@sympatico.ca', email)
    .replace(/mailto:abidingplaceministries@sympatico\.ca/g, `mailto:${email}`)
    .replaceAll('167 Centre Street, Shelburne', address)
    .replaceAll('167 Centre St, Shelburne, ON L9V 3R8', address)
    .replaceAll('Prunefolk Group', venue)
    .replaceAll('Use Door F entrance', entrance);

  if (contact.cell) {
    const cell = escapeHtml(contact.cell);
    const cellHref = String(contact.cell).replace(/[^+\d]/g, '');
    html = html.replaceAll('519-216-1804', cell).replace(/tel:519[-\s]?216[-\s]?1804/g, `tel:${cellHref}`);
  } else {
    html = html.replace(/<div class="contact-item"><span class="contact-icon"><svg viewBox="0 0 24 24"><path d="M17 1\.01L7 1[\s\S]*?<\/div><\/div><\/div>/, '');
  }
  return html;
}

function renderContactSchedule(html, gatherings = [], contact = {}) {
  const schedule = gatherings.map(item => `<p style="margin-bottom:0.75rem"><strong>${escapeHtml(item.name)} (${escapeHtml(item.day)}):</strong> ${escapeHtml(item.time)}</p>`).join('');
  const location = `${escapeHtml(contact.venue || 'Mel Lloyd Centre')}, ${escapeHtml(contact.address || '')}, ${escapeHtml(contact.entrance || 'Door F')}`;
  return replaceFirst(
    html,
    /(<div class="contact-card"><h2 style="margin-bottom:1\.5rem">Before You Visit<\/h2>)[\s\S]*?(<div style="display:flex;gap:0\.75rem;flex-wrap:wrap;margin-top:1\.5rem">)/,
    `$1${schedule}<p style="margin-bottom:1rem">All regular gatherings meet at ${location}. Study topics and special-event schedules should be confirmed directly.</p><p style="margin-bottom:1.5rem">If you need accessibility assistance, pastoral care, prayer or information about children’s ministry, call or email before arriving.</p>$2`,
    'contact schedule'
  );
}

function fixCanonicalUrls(html) {
  return html
    .replaceAll('https://abiding-place-fellowship-shelburne.vercel.app', 'https://abidingplace.netlify.app')
    .replaceAll('https://abiding-place-ministries.netlify.app', 'https://abidingplace.netlify.app')
    .replaceAll('https://abiding-place-ministries-cms.netlify.app', 'https://abidingplace.netlify.app');
}

function transformPages(data) {
  const htmlFiles = fs.readdirSync(PUBLIC).filter(name => name.endsWith('.html'));
  for (const file of htmlFiles) {
    const filePath = path.join(PUBLIC, file);
    let html = fs.readFileSync(filePath, 'utf8');
    html = applyContactDetails(html, data.contact);
    html = fixCanonicalUrls(html);

    if (file === 'index.html') {
      html = replaceFirst(
        html,
        /(<section class="section section-light" id="services">[\s\S]*?<div class="grid">)[\s\S]*?(<\/div><\/div><\/section>)/,
        `$1${renderHomeServiceCards(data.gatherings, data.contact)}$2`,
        'home weekly gatherings'
      );
      html = html.replace(
        /<div><h3>Service Times<\/h3>[\s\S]*?<\/div><div><h3>Contact<\/h3>/,
        `<div><h3>Service Times</h3>${renderServiceFooter(data.contact.service_times || [])}<p>📍 ${escapeHtml(data.contact.address || '')}</p></div><div><h3>Contact</h3>`
      );
    }

    if (file === 'events.html') {
      const cards = renderGatheringCards(data.gatherings, data.contact);
      html = replaceFirst(
        html,
        /(<h2 style="text-align:center">Regular Weekly Gatherings<\/h2><div class="events-grid">)[\s\S]*?(<\/div><\/div><\/section>)/,
        `$1${cards}$2`,
        'events weekly gatherings'
      );
      html = html.replace(/<div><h3 style="color:#fff">Service Times<\/h3>[\s\S]*?<\/div><\/div><p style="text-align:center/, `<div><h3 style="color:#fff">Service Times</h3>${renderServiceFooter(data.contact.service_times || [])}</div></div><p style="text-align:center`);
      const announcements = renderAnnouncementSection(data.announcements);
      if (announcements && !html.includes('Current Announcements')) {
        html = html.replace('<section class="section"><div class="container"><h2 style="text-align:center;margin-bottom:2rem">A History of Community Gathering</h2>', `${announcements}<section class="section"><div class="container"><h2 style="text-align:center;margin-bottom:2rem">A History of Community Gathering</h2>`);
      }
    }

    if (file === 'ministries.html') {
      html = replaceFirst(
        html,
        /(<div class="ministries-grid">)[\s\S]*?(<\/div><\/div><\/section>)/,
        `$1${renderMinistryCards(data.ministries)}$2`,
        'ministries grid'
      );
    }

    if (file === 'about.html') {
      html = replaceFirst(
        html,
        /(<div class="team-grid">)[\s\S]*?(<\/div><\/div><\/section>)/,
        `$1${renderLeadershipCards(data.leadership)}$2`,
        'leadership grid'
      );
    }

    if (file === 'contact.html') {
      html = renderContactSchedule(html, data.gatherings, data.contact);
    }

    fs.writeFileSync(filePath, html);
  }
}

function build() {
  console.log('🏗️  Building Abiding Place Fellowship...');
  cleanPublic();

  const contact = readYaml(path.join(CONFIG, 'contact.yaml'));
  const site = readYaml(path.join(CONFIG, 'site.yaml'));
  const gatheringsData = readYaml(path.join(SITE_CONTENT, 'weekly-gatherings.yaml'), { gatherings: [] });
  const leadershipData = readYaml(path.join(SITE_CONTENT, 'leadership.yaml'), { leadership: [] });
  const ministriesData = readYaml(path.join(SITE_CONTENT, 'ministries.yaml'), { ministries: [] });
  const announcementsData = readYaml(path.join(SITE_CONTENT, 'announcements.yaml'), { announcements: [] });

  const rootFiles = fs.readdirSync(ROOT, { withFileTypes: true });
  for (const entry of rootFiles) {
    if (entry.isFile() && entry.name.endsWith('.html')) copyFile(entry.name);
  }

  ['css', 'images', 'assets'].forEach(dir => copyDirectory(dir));
  ['mobile-nav.js', 'design-system.json'].forEach(file => copyFile(file));
  copyDirectory('admin');
  if (!fs.existsSync(path.join(PUBLIC, 'admin', 'index.html'))) {
    copyFile('admin/editor.html', 'admin/index.html');
  }

  const data = {
    site,
    contact,
    gatherings: gatheringsData.gatherings || [],
    leadership: leadershipData.leadership || [],
    ministries: ministriesData.ministries || [],
    announcements: announcementsData.announcements || []
  };

  transformPages(data);

  const dataPath = path.join(PUBLIC, 'content', 'site-data.json');
  fs.mkdirSync(path.dirname(dataPath), { recursive: true });
  fs.writeFileSync(dataPath, `${JSON.stringify(data, null, 2)}\n`);

  console.log(`✅ Built ${fs.readdirSync(PUBLIC).filter(name => name.endsWith('.html')).length} HTML pages`);
  console.log('✅ CMS editor available at /admin/');
  console.log('✅ Canonical CMS content rendered into public pages');
}

try {
  build();
} catch (error) {
  console.error('💥 Build failed:', error);
  process.exit(1);
}
