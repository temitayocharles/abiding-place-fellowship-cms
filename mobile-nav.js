<script>
  // Mobile menu toggle
  const nav = document.querySelector('.nav');
  const navLinks = document.querySelector('.nav-links');
  
  // Toggle on hamburger click (add hamburger button)
  const toggleBtn = document.createElement('button');
  toggleBtn.className = 'nav-toggle';
  toggleBtn.innerHTML = '<span></span><span></span><span></span>';
  toggleBtn.style.cssText = 'display:none;flex-direction:column;gap:3px;background:none;border:none;cursor:pointer;padding:0.5rem;min-height:44px;min-width:44px;';
  toggleBtn.innerHTML = '<span style="width:20px;height:2px;background:var(--text);"></span><span style="width:20px;height:2px;background:var(--text);"></span><span style="width:20px;height:2px;background:var(--text);"></span>';
  
  nav.insertBefore(toggleBtn, navLinks);
  
  toggleBtn.addEventListener('click', () => {
    navLinks.classList.toggle('active');
    const expanded = toggleBtn.getAttribute('aria-expanded') === 'true';
    toggleBtn.setAttribute('aria-expanded', !expanded);
  });
  
  // Close menu on link click
  navLinks.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => navLinks.classList.remove('active'));
  });
  
  // Close on escape
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') navLinks.classList.remove('active');
  });
  
  // Show hamburger on mobile
  const checkMobile = () => {
    if (window.innerWidth <= 768) {
      toggleBtn.style.display = 'flex';
      navLinks.classList.remove('active');
    } else {
      toggleBtn.style.display = 'none';
      navLinks.style.display = 'flex';
    }
  };
  
  checkMobile();
  window.addEventListener('resize', checkMobile);
</script>
<style>
  @media(max-width: 768px) {
    .nav-toggle { display: flex !important; }
    .nav-links {
      display: none;
      position: absolute;
      top: 100%;
      left: 0;
      right: 0;
      background: var(--surface);
      flex-direction: column;
      padding: 1rem;
      box-shadow: 0 4px 6px rgba(0,0,0,0.1);
      gap: 0.5rem;
    }
    .nav-links.active { display: flex; }
    .nav-links a { width: 100%; justify-content: center; }
  }
</style>