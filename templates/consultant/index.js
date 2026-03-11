const { escapeHtml } = require('../_helpers');

module.exports = {
  name: 'Consultant',
  description: 'Clean, trustworthy blue theme with card-based sections for consultants and coaches',
  thumbnail: '#1E40AF',

  renderPage(pageName, { tenant, content, blogPosts }) {
    const subdomain = tenant.subdomain;
    const siteTitle = escapeHtml(tenant.site_title || 'Consulting');
    const tagline = escapeHtml(tenant.site_tagline || '');
    blogPosts = (blogPosts || []).map(p => ({ ...p, title: escapeHtml(p.title), image_url: escapeHtml(p.image_url) }));

    const navLinks = [
      { href: `/site/${subdomain}/`, label: 'Home', page: 'index' },
      { href: `/site/${subdomain}/about`, label: 'About', page: 'about' },
      { href: `/site/${subdomain}/services`, label: 'Services', page: 'services' },
      { href: `/site/${subdomain}/blog`, label: 'Blog', page: 'blog' },
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
          <div class="container">
            <div class="hero-grid">
              <div class="hero-text">
                <h1>${siteTitle}</h1>
                ${tagline ? `<p class="tagline">${tagline}</p>` : ''}
                <a href="/site/${subdomain}/contact" class="btn btn-white">Book a Free Call</a>
              </div>
              <div class="hero-trust">
                <div class="trust-badge">
                  <div class="trust-icon">&#10003;</div>
                  <span>Trusted Advisor</span>
                </div>
              </div>
            </div>
          </div>
        </section>
        <section class="section">
          <div class="container">
            <div class="card intro-card">
              ${content.hero || '<p class="placeholder">Send an email to update this section.</p>'}
            </div>
          </div>
        </section>`;

        case 'about':
          return `
        <section class="page-header">
          <div class="container">
            <h1>About</h1>
            <p class="page-subtitle">Get to know the person behind the practice</p>
          </div>
        </section>
        <section class="section">
          <div class="container">
            <div class="card">
              ${content.about || '<p class="placeholder">Send an email to update this section.</p>'}
            </div>
          </div>
        </section>`;

        case 'contact':
          return `
        <section class="page-header">
          <div class="container">
            <h1>Let's Connect</h1>
            <p class="page-subtitle">Ready to take the next step? Reach out today.</p>
          </div>
        </section>
        <section class="section">
          <div class="container">
            <div class="card contact-card">
              ${content.contact || '<p class="placeholder">Send an email to update this section.</p>'}
            </div>
            ${content.hours ? `
            <div class="card availability-card">
              <h2>Availability</h2>
              ${content.hours}
            </div>` : ''}
          </div>
        </section>`;

        case 'services':
          return `
        <section class="page-header">
          <div class="container">
            <h1>Services</h1>
            <p class="page-subtitle">How I can help you achieve your goals</p>
          </div>
        </section>
        <section class="section">
          <div class="container">
            <div class="card">
              ${content.services || '<p class="placeholder">Send an email to update this section.</p>'}
            </div>
            ${content.hours ? `
            <div class="card availability-card">
              <h2>Availability</h2>
              ${content.hours}
            </div>` : ''}
          </div>
        </section>`;

        case 'blog':
          return `
        <section class="page-header">
          <div class="container">
            <h1>Insights</h1>
            <p class="page-subtitle">Thoughts, strategies, and actionable advice</p>
          </div>
        </section>
        <section class="section">
          <div class="container">
            ${blogPosts.length === 0
              ? '<p class="placeholder">No posts yet. Send an email with subject "Blog: Your Title" to share insights.</p>'
              : blogPosts.map(post => `
                <article class="card insight-card">
                  <div class="insight-inner">
                    ${post.image_url ? `<img src="${post.image_url}" alt="${post.title}" class="insight-img">` : ''}
                    <div class="insight-text">
                      <time>${post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</time>
                      <h2>${post.title}</h2>
                      <div class="insight-body">${post.content}</div>
                    </div>
                  </div>
                </article>`).join('')}
          </div>
        </section>`;

        default:
          return `<section class="section"><div class="container"><p>Page not found.</p></div></section>`;
      }
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageName === 'index' ? siteTitle : pageName.charAt(0).toUpperCase() + pageName.slice(1) + ' - ' + siteTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Lato:wght@300;400;700;900&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Lato', sans-serif;
      background: #F8FAFC;
      color: #333;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    img { max-width: 100%; height: auto; }
    .container { max-width: 920px; margin: 0 auto; padding: 0 24px; }

    /* Header */
    header {
      background: #fff;
      padding: 0 24px;
      border-bottom: 1px solid #E2E8F0;
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .header-inner {
      max-width: 920px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 68px;
    }
    .logo {
      font-size: 1.2rem;
      font-weight: 900;
      color: #1E40AF;
      text-decoration: none;
    }
    nav { display: flex; gap: 28px; align-items: center; }
    nav a {
      color: #64748B;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 700;
      transition: color 0.2s;
    }
    nav a:hover, nav a.active { color: #1E40AF; }
    .hamburger { display: none; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #1E40AF; }

    /* Hero */
    .hero {
      background: linear-gradient(135deg, #1E3A6E 0%, #1E40AF 50%, #2563EB 100%);
      color: #fff;
      padding: 72px 24px;
    }
    .hero-grid { display: flex; align-items: center; justify-content: space-between; gap: 40px; }
    .hero-text { flex: 1; }
    .hero-text h1 { font-size: 2.75rem; font-weight: 900; margin-bottom: 16px; line-height: 1.15; }
    .hero-text .tagline { font-size: 1.15rem; opacity: 0.85; line-height: 1.7; margin-bottom: 28px; font-weight: 300; }
    .hero-trust { flex-shrink: 0; }
    .trust-badge {
      background: rgba(255,255,255,0.12);
      border: 2px solid rgba(255,255,255,0.2);
      border-radius: 12px;
      padding: 28px 32px;
      text-align: center;
    }
    .trust-icon {
      width: 48px;
      height: 48px;
      background: rgba(255,255,255,0.18);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.5rem;
      margin: 0 auto 12px;
      font-weight: 700;
    }
    .trust-badge span { font-size: 0.85rem; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em; }

    /* Buttons */
    .btn { display: inline-block; padding: 14px 32px; border-radius: 6px; font-size: 0.95rem; font-weight: 700; text-decoration: none; transition: all 0.2s; }
    .btn-white { background: #fff; color: #1E40AF; }
    .btn-white:hover { background: #DBEAFE; }

    /* Page Header */
    .page-header {
      background: linear-gradient(135deg, #1E3A6E 0%, #1E40AF 100%);
      color: #fff;
      padding: 48px 24px;
    }
    .page-header h1 { font-size: 2.25rem; font-weight: 900; margin-bottom: 8px; }
    .page-subtitle { font-size: 1.05rem; opacity: 0.8; font-weight: 300; }

    /* Cards */
    .card {
      background: #fff;
      border: 1px solid #E2E8F0;
      border-radius: 12px;
      padding: 36px;
      margin-bottom: 24px;
      line-height: 1.9;
      font-size: 1.05rem;
      color: #475569;
    }
    .intro-card {
      font-size: 1.1rem;
      max-width: 740px;
    }
    .contact-card {
      border-left: 4px solid #1E40AF;
    }
    .availability-card {
      background: #DBEAFE;
      border: 1px solid #BFDBFE;
    }
    .availability-card h2 { font-size: 1.3rem; color: #1E40AF; margin-bottom: 12px; font-weight: 900; }

    /* Sections */
    .section { padding: 56px 0; flex: 1; }
    .placeholder { color: #94A3B8; text-align: center; padding: 32px 0; font-style: italic; }

    /* Blog/Insights */
    .insight-card {
      padding: 0;
      overflow: hidden;
      transition: box-shadow 0.2s;
    }
    .insight-card:hover { box-shadow: 0 4px 24px rgba(30,64,175,0.08); }
    .insight-inner { display: flex; align-items: stretch; }
    .insight-img { width: 280px; height: auto; object-fit: cover; flex-shrink: 0; }
    .insight-text { padding: 28px; flex: 1; }
    .insight-text time { font-size: 0.8rem; color: #94A3B8; display: block; margin-bottom: 8px; font-weight: 700; text-transform: uppercase; letter-spacing: 0.05em; }
    .insight-text h2 { font-size: 1.25rem; color: #1E40AF; margin-bottom: 12px; font-weight: 900; }
    .insight-body { line-height: 1.7; color: #475569; font-size: 0.95rem; }

    /* Footer */
    footer {
      border-top: 1px solid #E2E8F0;
      background: #fff;
      padding: 24px;
      text-align: center;
      font-size: 0.8rem;
      color: #94A3B8;
    }
    footer a { color: #64748B; text-decoration: none; }
    footer a:hover { color: #1E40AF; }

    @media (max-width: 768px) {
      .hamburger { display: block; }
      nav {
        display: none;
        position: absolute;
        top: 68px;
        left: 0;
        right: 0;
        background: #fff;
        flex-direction: column;
        padding: 20px 24px;
        gap: 16px;
        z-index: 100;
        border-bottom: 1px solid #E2E8F0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      }
      nav.open { display: flex; }
      .hero-text h1 { font-size: 2rem; }
      .hero-grid { flex-direction: column; text-align: center; }
      .hero-trust { display: none; }
      .insight-inner { flex-direction: column; }
      .insight-img { width: 100%; height: 200px; }
      .card { padding: 24px; }
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
