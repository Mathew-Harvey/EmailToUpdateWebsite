const { escapeHtml } = require('../_helpers');

module.exports = {
  name: 'Wellness',
  description: 'Soft, calming pastel design with flowing rounded elements for spas, yoga studios, and wellness coaches',
  thumbnail: '#A7F3D0',

  renderPage(pageName, { tenant, content, blogPosts }) {
    const subdomain = tenant.subdomain;
    const siteTitle = escapeHtml(tenant.site_title || 'Wellness Studio');
    const tagline = escapeHtml(tenant.site_tagline || '');
    blogPosts = (blogPosts || []).map(p => ({ ...p, title: escapeHtml(p.title), image_url: escapeHtml(p.image_url) }));

    const navLinks = [
      { href: `/site/${subdomain}/`, label: 'Home', page: 'index' },
      { href: `/site/${subdomain}/about`, label: 'About', page: 'about' },
      { href: `/site/${subdomain}/services`, label: 'Services', page: 'services' },
      { href: `/site/${subdomain}/blog`, label: 'Journal', page: 'blog' },
      { href: `/site/${subdomain}/contact`, label: 'Contact', page: 'contact' }
    ];

    const nav = navLinks.map(link => {
      const isActive = pageName === link.page;
      return `<a href="${link.href}" class="${isActive ? 'active' : ''}">${link.label}</a>`;
    }).join('\n            ');

    function getPageContent() {
      switch (pageName) {
        case 'index':
          return `
        <section class="hero">
          <div class="hero-inner">
            <div class="hero-circle"></div>
            <h1>${siteTitle}</h1>
            ${tagline ? `<p class="tagline">${tagline}</p>` : ''}
            <div class="hero-actions">
              <a href="/site/${subdomain}/services" class="btn btn-sage">Explore Services</a>
              <a href="/site/${subdomain}/contact" class="btn btn-outline">Book a Session</a>
            </div>
          </div>
        </section>
        <section class="section bg-light">
          <div class="container">
            <div class="wave-divider">~ ~ ~</div>
            <div class="intro-content">
              ${content.hero || '<p class="placeholder">Send an email to update this section.</p>'}
            </div>
          </div>
        </section>
        ${content.hours ? `
        <section class="section bg-lavender">
          <div class="container">
            <h2 class="section-heading">Hours</h2>
            <div class="wave-divider small">~ ~ ~</div>
            <div class="hours-card">
              ${content.hours}
            </div>
          </div>
        </section>` : ''}
        <section class="section bg-light">
          <div class="container center-text">
            <h2 class="section-heading">Begin Your Journey</h2>
            <p class="gentle-text">Take the first step toward a more balanced, peaceful life.</p>
            <a href="/site/${subdomain}/contact" class="btn btn-sage">Get in Touch</a>
          </div>
        </section>`;

        case 'about':
          return `
        <section class="page-hero">
          <div class="hero-circle small"></div>
          <h1>About</h1>
          <p class="page-subtitle">Our philosophy and approach to wellness</p>
        </section>
        <section class="section bg-light">
          <div class="container">
            <div class="wave-divider">~ ~ ~</div>
            <div class="body-content">
              ${content.about || '<p class="placeholder">Send an email to update this section.</p>'}
            </div>
          </div>
        </section>`;

        case 'contact':
          return `
        <section class="page-hero">
          <div class="hero-circle small"></div>
          <h1>Contact</h1>
          <p class="page-subtitle">We would love to connect with you</p>
        </section>
        <section class="section bg-light">
          <div class="container">
            <div class="wave-divider">~ ~ ~</div>
            <div class="contact-layout">
              <div class="contact-main">
                ${content.contact || '<p class="placeholder">Send an email to update this section.</p>'}
              </div>
              ${content.hours ? `
              <div class="hours-sidebar">
                <h3>Our Hours</h3>
                <div class="hours-text">${content.hours}</div>
              </div>` : ''}
            </div>
          </div>
        </section>`;

        case 'services':
          return `
        <section class="page-hero">
          <div class="hero-circle small"></div>
          <h1>Services</h1>
          <p class="page-subtitle">Nurturing mind, body, and spirit</p>
        </section>
        <section class="section bg-light">
          <div class="container">
            <div class="wave-divider">~ ~ ~</div>
            <div class="services-content">
              ${content.services || '<p class="placeholder">Send an email to update this section.</p>'}
            </div>
            ${content.hours ? `
            <div class="hours-sidebar standalone">
              <h3>Session Hours</h3>
              <div class="hours-text">${content.hours}</div>
            </div>` : ''}
          </div>
        </section>`;

        case 'blog':
          return `
        <section class="page-hero">
          <div class="hero-circle small"></div>
          <h1>Journal</h1>
          <p class="page-subtitle">Reflections, tips, and inspiration</p>
        </section>
        <section class="section bg-light">
          <div class="container">
            <div class="wave-divider">~ ~ ~</div>
            ${blogPosts.length === 0
              ? '<p class="placeholder">No entries yet. Send an email with subject "Blog: Your Title" to share your thoughts.</p>'
              : blogPosts.map(post => `
              <article class="journal-entry">
                ${post.image_url ? `<img src="${post.image_url}" alt="${post.title}" class="journal-img">` : ''}
                <div class="journal-body">
                  <time>${post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</time>
                  <h2>${post.title}</h2>
                  <div class="journal-text">${post.content}</div>
                </div>
              </article>`).join('')}
          </div>
        </section>`;

        default:
          return `<section class="section bg-light"><div class="container"><p>Page not found.</p></div></section>`;
      }
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageName === 'index' ? siteTitle : (pageName === 'blog' ? 'Journal' : pageName.charAt(0).toUpperCase() + pageName.slice(1)) + ' - ' + siteTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Quicksand', sans-serif;
      background: #ECFDF5;
      color: #374151;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    img { max-width: 100%; height: auto; }
    .container { max-width: 880px; margin: 0 auto; padding: 0 24px; }

    /* Header */
    header {
      background: rgba(255,255,255,0.85);
      backdrop-filter: blur(12px);
      padding: 0 24px;
      border-bottom: 1px solid rgba(167,243,208,0.4);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .header-inner {
      max-width: 880px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
    }
    .logo {
      font-size: 1.2rem;
      font-weight: 700;
      color: #065F46;
      text-decoration: none;
      letter-spacing: 0.02em;
    }
    nav { display: flex; gap: 28px; }
    nav a {
      color: #6B7280;
      text-decoration: none;
      font-size: 0.88rem;
      font-weight: 600;
      transition: color 0.3s;
    }
    nav a:hover, nav a.active { color: #065F46; }
    .hamburger { display: none; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #065F46; }

    /* Hero */
    .hero {
      background: linear-gradient(160deg, #A7F3D0 0%, #C4B5FD 50%, #DDD6FE 100%);
      padding: 96px 24px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .hero-inner { position: relative; z-index: 2; max-width: 620px; margin: 0 auto; }
    .hero-circle {
      width: 400px;
      height: 400px;
      background: rgba(255,255,255,0.2);
      border-radius: 50%;
      position: absolute;
      top: -100px;
      right: -80px;
      z-index: 1;
    }
    .hero-circle.small {
      width: 200px;
      height: 200px;
      top: -60px;
      right: -40px;
    }
    .hero h1 {
      font-size: 3rem;
      font-weight: 700;
      color: #064E3B;
      margin-bottom: 16px;
      line-height: 1.2;
    }
    .hero .tagline {
      font-size: 1.1rem;
      color: #374151;
      line-height: 1.7;
      margin-bottom: 32px;
      font-weight: 400;
    }
    .hero-actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }

    /* Buttons */
    .btn {
      display: inline-block;
      padding: 14px 32px;
      border-radius: 50px;
      font-size: 0.9rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.3s;
    }
    .btn-sage { background: #065F46; color: #ECFDF5; }
    .btn-sage:hover { background: #047857; }
    .btn-outline { background: transparent; color: #065F46; border: 2px solid rgba(6,95,70,0.3); }
    .btn-outline:hover { border-color: #065F46; }

    /* Page Hero */
    .page-hero {
      background: linear-gradient(160deg, #A7F3D0 0%, #C4B5FD 100%);
      padding: 56px 24px;
      text-align: center;
      position: relative;
      overflow: hidden;
    }
    .page-hero h1 {
      font-size: 2.4rem;
      font-weight: 700;
      color: #064E3B;
      margin-bottom: 8px;
      position: relative;
      z-index: 2;
    }
    .page-subtitle {
      font-size: 1.02rem;
      color: #374151;
      font-weight: 400;
      position: relative;
      z-index: 2;
    }

    /* Sections */
    .section { padding: 56px 0; }
    .bg-light { background: #ECFDF5; flex: 1; }
    .bg-lavender { background: #EDE9FE; }
    .section-heading {
      text-align: center;
      font-size: 1.5rem;
      font-weight: 700;
      color: #065F46;
      margin-bottom: 8px;
    }
    .center-text { text-align: center; }
    .gentle-text {
      color: #6B7280;
      font-size: 1.02rem;
      line-height: 1.7;
      margin-bottom: 24px;
    }

    /* Wave Divider */
    .wave-divider {
      text-align: center;
      font-size: 1.5rem;
      color: #A7F3D0;
      margin-bottom: 32px;
      letter-spacing: 0.3em;
    }
    .wave-divider.small { font-size: 1.2rem; margin-bottom: 20px; }

    /* Content */
    .intro-content {
      font-size: 1.05rem;
      line-height: 1.9;
      color: #4B5563;
      text-align: center;
      max-width: 680px;
      margin: 0 auto;
    }
    .body-content { font-size: 1.02rem; line-height: 1.9; color: #4B5563; }
    .services-content { font-size: 1.02rem; line-height: 1.9; color: #4B5563; }
    .services-content h1, .services-content h2, .services-content h3 {
      color: #065F46;
      margin-top: 28px;
      margin-bottom: 8px;
    }
    .placeholder { color: #9CA3AF; text-align: center; padding: 32px 0; font-style: italic; }

    /* Hours */
    .hours-card {
      max-width: 400px;
      margin: 0 auto;
      background: rgba(255,255,255,0.6);
      border-radius: 24px;
      padding: 32px;
      text-align: center;
      line-height: 1.9;
      color: #4B5563;
      backdrop-filter: blur(6px);
    }
    .hours-sidebar {
      background: linear-gradient(135deg, rgba(167,243,208,0.3), rgba(196,181,253,0.3));
      border-radius: 20px;
      padding: 28px;
      margin-top: 32px;
    }
    .hours-sidebar.standalone { margin-top: 40px; }
    .hours-sidebar h3 {
      font-size: 1.1rem;
      font-weight: 700;
      color: #065F46;
      margin-bottom: 12px;
    }
    .hours-text { line-height: 1.9; font-size: 0.95rem; color: #4B5563; }

    /* Contact Layout */
    .contact-layout { display: grid; grid-template-columns: 1fr; gap: 32px; }
    .contact-main {
      line-height: 1.9;
      font-size: 1.02rem;
      color: #4B5563;
    }

    /* Journal/Blog */
    .journal-entry {
      margin-bottom: 40px;
      background: rgba(255,255,255,0.7);
      border-radius: 24px;
      overflow: hidden;
      backdrop-filter: blur(6px);
      transition: box-shadow 0.3s;
    }
    .journal-entry:hover { box-shadow: 0 8px 32px rgba(6,95,70,0.08); }
    .journal-img {
      width: 100%;
      height: 300px;
      object-fit: cover;
    }
    .journal-body { padding: 32px; }
    .journal-body time {
      font-size: 0.8rem;
      color: #9CA3AF;
      display: block;
      margin-bottom: 8px;
      font-weight: 600;
    }
    .journal-body h2 {
      font-size: 1.4rem;
      font-weight: 700;
      color: #065F46;
      margin-bottom: 14px;
    }
    .journal-text { line-height: 1.8; color: #4B5563; font-size: 0.95rem; }

    /* Footer */
    footer {
      background: linear-gradient(135deg, #A7F3D0, #C4B5FD);
      padding: 28px 24px;
      text-align: center;
      font-size: 0.82rem;
      color: #374151;
    }
    footer a { color: #065F46; text-decoration: none; font-weight: 600; }
    footer a:hover { text-decoration: underline; }

    @media (max-width: 768px) {
      .hamburger { display: block; }
      nav {
        display: none;
        position: absolute;
        top: 64px;
        left: 0;
        right: 0;
        background: rgba(255,255,255,0.95);
        backdrop-filter: blur(12px);
        flex-direction: column;
        padding: 20px 24px;
        gap: 14px;
        z-index: 100;
        border-bottom: 1px solid rgba(167,243,208,0.4);
      }
      nav.open { display: flex; }
      .hero h1 { font-size: 2.2rem; }
      .hero { padding: 64px 24px; }
      .hero-circle { width: 200px; height: 200px; top: -60px; right: -60px; }
      .page-hero h1 { font-size: 1.8rem; }
      .journal-img { height: 200px; }
    }
  </style>
</head>
<body>
  <header>
    <div class="header-inner" style="position: relative;">
      <a href="/site/${subdomain}/" class="logo">${siteTitle}</a>
      <button class="hamburger" onclick="document.querySelector('nav').classList.toggle('open')" aria-label="Menu">&#9776;</button>
      <nav>
            ${nav}
      </nav>
    </div>
  </header>
  <main style="flex: 1; display: flex; flex-direction: column;">
    ${getPageContent()}
  </main>
  <footer>
    <p>Powered by <a href="/">EmailSite</a></p>
  </footer>
</body>
</html>`;
  }
};
