const { escapeHtml } = require('../_helpers');

module.exports = {
  name: 'Nonprofit',
  description: 'Warm, inviting earth tones with green accents for charities, churches, and community orgs',
  thumbnail: '#166534',

  renderPage(pageName, { tenant, content, blogPosts }) {
    const subdomain = tenant.subdomain;
    const siteTitle = escapeHtml(tenant.site_title || 'Our Organization');
    const tagline = escapeHtml(tenant.site_tagline || '');
    blogPosts = (blogPosts || []).map(p => ({ ...p, title: escapeHtml(p.title), image_url: escapeHtml(p.image_url) }));

    const navLinks = [
      { href: `/site/${subdomain}/`, label: 'Home', page: 'index' },
      { href: `/site/${subdomain}/about`, label: 'Mission', page: 'about' },
      { href: `/site/${subdomain}/services`, label: 'Programs', page: 'services' },
      { href: `/site/${subdomain}/blog`, label: 'Stories', page: 'blog' },
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
            <h1>${siteTitle}</h1>
            ${tagline ? `<p class="tagline">${tagline}</p>` : ''}
            <div class="hero-actions">
              <a href="/site/${subdomain}/about" class="btn btn-light">Learn Our Mission</a>
              <a href="/site/${subdomain}/contact" class="btn btn-outline">Get Involved</a>
            </div>
          </div>
        </section>
        <section class="section bg-cream">
          <div class="container">
            <div class="impact-content">
              ${content.hero || '<p class="placeholder">Send an email to update this section.</p>'}
            </div>
          </div>
        </section>
        ${content.hours ? `
        <section class="section bg-green-light">
          <div class="container">
            <h2 class="section-title">Office Hours</h2>
            <div class="hours-text">
              ${content.hours}
            </div>
          </div>
        </section>` : ''}`;

        case 'about':
          return `
        <section class="page-hero">
          <h1>Our Mission</h1>
          <p class="page-subtitle">What drives us every day</p>
        </section>
        <section class="section bg-cream">
          <div class="container">
            <div class="mission-content">
              ${content.about || '<p class="placeholder">Send an email to update this section.</p>'}
            </div>
          </div>
        </section>`;

        case 'contact':
          return `
        <section class="page-hero">
          <h1>Get in Touch</h1>
          <p class="page-subtitle">We would love to hear from you</p>
        </section>
        <section class="section bg-cream">
          <div class="container">
            <div class="contact-wrapper">
              <div class="contact-main">
                ${content.contact || '<p class="placeholder">Send an email to update this section.</p>'}
              </div>
              ${content.hours ? `
              <div class="office-hours">
                <h3>Office Hours</h3>
                ${content.hours}
              </div>` : ''}
            </div>
          </div>
        </section>`;

        case 'services':
          return `
        <section class="page-hero">
          <h1>Our Programs</h1>
          <p class="page-subtitle">How we make a difference</p>
        </section>
        <section class="section bg-cream">
          <div class="container">
            <div class="programs-content">
              ${content.services || '<p class="placeholder">Send an email to update this section.</p>'}
            </div>
          </div>
        </section>`;

        case 'blog':
          return `
        <section class="page-hero">
          <h1>Stories of Impact</h1>
          <p class="page-subtitle">See the difference we are making together</p>
        </section>
        <section class="section bg-cream">
          <div class="container">
            ${blogPosts.length === 0
              ? '<p class="placeholder">No stories yet. Send an email with subject "Blog: Your Title" to share a story.</p>'
              : blogPosts.map(post => `
                <article class="story-card">
                  ${post.image_url ? `<img src="${post.image_url}" alt="${post.title}" class="story-img">` : ''}
                  <div class="story-body">
                    <time>${post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</time>
                    <h2>${post.title}</h2>
                    <div class="story-text">${post.content}</div>
                  </div>
                </article>`).join('')}
          </div>
        </section>`;

        default:
          return `<section class="section bg-cream"><div class="container"><p>Page not found.</p></div></section>`;
      }
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageName === 'index' ? siteTitle : (pageName === 'about' ? 'Mission' : pageName === 'services' ? 'Programs' : pageName === 'blog' ? 'Stories' : pageName.charAt(0).toUpperCase() + pageName.slice(1)) + ' - ' + siteTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Nunito:wght@300;400;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Nunito', sans-serif;
      background: #FEF3C7;
      color: #333;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    img { max-width: 100%; height: auto; }
    .container { max-width: 900px; margin: 0 auto; padding: 0 24px; }

    /* Header */
    header {
      background: #166534;
      padding: 0 24px;
    }
    .header-inner {
      max-width: 900px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 68px;
    }
    .logo {
      font-size: 1.15rem;
      font-weight: 800;
      color: #fff;
      text-decoration: none;
    }
    nav { display: flex; gap: 24px; }
    nav a {
      color: rgba(255,255,255,0.75);
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 700;
      transition: color 0.2s;
    }
    nav a:hover, nav a.active { color: #FEF3C7; }
    .hamburger { display: none; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #fff; }

    /* Hero */
    .hero {
      background: linear-gradient(160deg, #166534 0%, #15803D 50%, #22C55E 100%);
      color: #fff;
      text-align: center;
      padding: 88px 24px;
    }
    .hero-inner { max-width: 660px; margin: 0 auto; }
    .hero h1 { font-size: 3.2rem; font-weight: 800; margin-bottom: 16px; line-height: 1.15; }
    .hero .tagline { font-size: 1.15rem; opacity: 0.9; line-height: 1.7; margin-bottom: 32px; font-weight: 400; }
    .hero-actions { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }

    /* Buttons */
    .btn { display: inline-block; padding: 14px 28px; border-radius: 8px; font-size: 0.9rem; font-weight: 700; text-decoration: none; transition: all 0.2s; }
    .btn-light { background: #FEF3C7; color: #166534; }
    .btn-light:hover { background: #FDE68A; }
    .btn-outline { background: transparent; color: #fff; border: 2px solid rgba(255,255,255,0.35); }
    .btn-outline:hover { border-color: #fff; }

    /* Page Hero */
    .page-hero {
      background: linear-gradient(160deg, #166534 0%, #15803D 100%);
      color: #fff;
      padding: 52px 24px;
      text-align: center;
    }
    .page-hero h1 { font-size: 2.4rem; font-weight: 800; margin-bottom: 8px; }
    .page-subtitle { font-size: 1rem; opacity: 0.8; font-weight: 400; }

    /* Sections */
    .section { padding: 56px 0; flex: 1; }
    .bg-cream { background: #FEF3C7; }
    .bg-green-light { background: #F0FDF4; }
    .section-title { text-align: center; font-size: 1.5rem; font-weight: 800; color: #166534; margin-bottom: 20px; }
    .impact-content {
      font-size: 1.15rem;
      line-height: 1.9;
      color: #4a5568;
      text-align: center;
      max-width: 720px;
      margin: 0 auto;
    }
    .mission-content { font-size: 1.05rem; line-height: 1.9; color: #4a5568; }
    .programs-content { font-size: 1.05rem; line-height: 1.9; color: #4a5568; }
    .placeholder { color: #9CA38A; text-align: center; padding: 32px 0; font-style: italic; }

    /* Hours */
    .hours-text { text-align: center; line-height: 1.9; color: #3D5A3F; font-size: 1rem; }

    /* Contact */
    .contact-wrapper { display: grid; grid-template-columns: 1fr; gap: 32px; }
    .contact-main { line-height: 1.9; font-size: 1.05rem; color: #4a5568; }
    .office-hours {
      background: #F0FDF4;
      border-radius: 12px;
      padding: 28px;
      border-left: 4px solid #166534;
    }
    .office-hours h3 { font-size: 1.1rem; color: #166534; margin-bottom: 10px; font-weight: 800; }

    /* Stories/Blog */
    .story-card {
      margin-bottom: 36px;
      background: #fff;
      border-radius: 12px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(22,101,52,0.06);
    }
    .story-img { width: 100%; height: 280px; object-fit: cover; }
    .story-body { padding: 28px; }
    .story-body time { font-size: 0.8rem; color: #9CA3AF; display: block; margin-bottom: 8px; font-weight: 700; }
    .story-body h2 { font-size: 1.35rem; font-weight: 800; color: #166534; margin-bottom: 12px; }
    .story-text { line-height: 1.8; color: #4a5568; font-size: 0.95rem; }

    /* Footer */
    footer {
      background: #166534;
      color: rgba(255,255,255,0.5);
      padding: 24px;
      text-align: center;
      font-size: 0.8rem;
    }
    footer a { color: rgba(255,255,255,0.7); text-decoration: none; }
    footer a:hover { color: #FEF3C7; }

    @media (max-width: 768px) {
      .hamburger { display: block; }
      nav {
        display: none;
        position: absolute;
        top: 68px;
        left: 0;
        right: 0;
        background: #166534;
        flex-direction: column;
        padding: 20px 24px;
        gap: 14px;
        z-index: 100;
      }
      nav.open { display: flex; }
      .hero h1 { font-size: 2.25rem; }
      .hero { padding: 56px 24px; }
      .page-hero h1 { font-size: 1.75rem; }
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
