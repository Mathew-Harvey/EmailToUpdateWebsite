const { escapeHtml } = require('../_helpers');

module.exports = {
  name: 'Business',
  description: 'Professional dark navy header with white body, ideal for professional services',
  thumbnail: '#1a2744',

  renderPage(pageName, { tenant, content, blogPosts }) {
    const subdomain = tenant.subdomain;
    const siteTitle = escapeHtml(tenant.site_title || 'My Business');
    const tagline = escapeHtml(tenant.site_tagline || '');
    blogPosts = (blogPosts || []).map(p => ({ ...p, title: escapeHtml(p.title), image_url: escapeHtml(p.image_url) }));

    const navLinks = [
      { href: `/site/${subdomain}/`, label: 'Home' },
      { href: `/site/${subdomain}/about`, label: 'About' },
      { href: `/site/${subdomain}/services`, label: 'Services' },
      { href: `/site/${subdomain}/blog`, label: 'Blog' },
      { href: `/site/${subdomain}/contact`, label: 'Contact' }
    ];

    const nav = navLinks.map(link => {
      const isActive = (pageName === 'index' && link.label === 'Home') ||
                        link.label.toLowerCase() === pageName;
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
            <div class="hero-ctas">
              <a href="/site/${subdomain}/contact" class="btn btn-primary">Get a Free Consultation</a>
              <a href="/site/${subdomain}/services" class="btn btn-outline">Our Services</a>
            </div>
          </div>
        </section>
        <section class="content-section">
          <div class="container">
            ${content.hero || '<p class="placeholder">Send an email to update this section.</p>'}
          </div>
        </section>`;

        case 'about':
          return `
        <section class="page-header">
          <h1>About Us</h1>
        </section>
        <section class="content-section">
          <div class="container">
            ${content.about || '<p class="placeholder">Send an email to update this section.</p>'}
          </div>
        </section>`;

        case 'contact':
          return `
        <section class="page-header">
          <h1>Contact Us</h1>
        </section>
        <section class="content-section">
          <div class="container">
            <div class="contact-grid">
              <div class="contact-info">
                ${content.contact || '<p class="placeholder">Send an email to update this section.</p>'}
              </div>
            </div>
          </div>
        </section>`;

        case 'services':
          return `
        <section class="page-header">
          <h1>Our Services</h1>
        </section>
        <section class="content-section">
          <div class="container">
            ${content.services || '<p class="placeholder">Send an email to update this section.</p>'}
            ${content.hours ? `
            <div class="hours-box">
              <h2>Business Hours</h2>
              ${content.hours}
            </div>` : ''}
          </div>
        </section>`;

        case 'blog':
          return `
        <section class="page-header">
          <h1>Insights &amp; News</h1>
        </section>
        <section class="content-section">
          <div class="container">
            ${blogPosts.length === 0
              ? '<p class="placeholder">No posts yet. Send an email with subject "Blog: Your Title" to create a post.</p>'
              : `<div class="blog-grid">${blogPosts.map(post => `
                <article class="blog-card">
                  ${post.image_url ? `<img src="${post.image_url}" alt="${post.title}" class="blog-img">` : '<div class="blog-img-placeholder"></div>'}
                  <div class="blog-card-body">
                    <time>${post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</time>
                    <h2>${post.title}</h2>
                    <div class="blog-excerpt">${post.content}</div>
                  </div>
                </article>`).join('')}</div>`}
          </div>
        </section>`;

        default:
          return `<section class="content-section"><div class="container"><p>Page not found.</p></div></section>`;
      }
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageName === 'index' ? siteTitle : pageName.charAt(0).toUpperCase() + pageName.slice(1) + ' - ' + siteTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Roboto', sans-serif;
      background: #fff;
      color: #333;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    img { max-width: 100%; height: auto; }
    .container { max-width: 960px; margin: 0 auto; padding: 0 24px; }

    /* Header */
    header {
      background: #1a2744;
      padding: 0 24px;
    }
    .header-inner {
      max-width: 960px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 72px;
    }
    .logo {
      font-size: 1.2rem;
      font-weight: 700;
      color: #fff;
      text-decoration: none;
      letter-spacing: 0.02em;
    }
    nav { display: flex; gap: 28px; align-items: center; }
    nav a {
      color: rgba(255,255,255,0.75);
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: color 0.2s;
    }
    nav a:hover, nav a.active { color: #fff; }
    .hamburger { display: none; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #fff; }

    /* Hero */
    .hero {
      background: linear-gradient(135deg, #1a2744 0%, #2d4a7a 100%);
      color: #fff;
      padding: 80px 24px;
      text-align: center;
    }
    .hero-inner { max-width: 700px; margin: 0 auto; }
    .hero h1 { font-size: 2.75rem; font-weight: 700; margin-bottom: 16px; letter-spacing: -0.01em; }
    .hero .tagline { font-size: 1.2rem; opacity: 0.85; margin-bottom: 32px; line-height: 1.6; font-weight: 300; }
    .hero-ctas { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; }

    /* Buttons */
    .btn {
      display: inline-block;
      padding: 14px 28px;
      border-radius: 4px;
      font-size: 0.95rem;
      font-weight: 500;
      text-decoration: none;
      transition: all 0.2s;
      cursor: pointer;
    }
    .btn-primary { background: #e8a838; color: #1a2744; }
    .btn-primary:hover { background: #d4952e; }
    .btn-outline { border: 2px solid rgba(255,255,255,0.4); color: #fff; background: transparent; }
    .btn-outline:hover { border-color: #fff; }

    /* Page Header */
    .page-header {
      background: #1a2744;
      color: #fff;
      padding: 48px 24px;
      text-align: center;
    }
    .page-header h1 { font-size: 2rem; font-weight: 700; }

    /* Content */
    .content-section { padding: 48px 0; flex: 1; }
    .content-section .container { line-height: 1.8; font-size: 1.05rem; color: #444; }
    .placeholder { color: #999; text-align: center; padding: 40px 0; }

    /* Hours Box */
    .hours-box {
      margin-top: 40px;
      padding: 32px;
      background: #f7f8fa;
      border-radius: 8px;
      border-left: 4px solid #1a2744;
    }
    .hours-box h2 { font-size: 1.3rem; margin-bottom: 12px; color: #1a2744; }

    /* Blog */
    .blog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 28px; }
    .blog-card { border: 1px solid #e8eaed; border-radius: 8px; overflow: hidden; transition: box-shadow 0.2s; }
    .blog-card:hover { box-shadow: 0 4px 16px rgba(0,0,0,0.08); }
    .blog-img { width: 100%; height: 200px; object-fit: cover; }
    .blog-img-placeholder { width: 100%; height: 200px; background: linear-gradient(135deg, #1a2744, #2d4a7a); }
    .blog-card-body { padding: 20px; }
    .blog-card-body time { font-size: 0.8rem; color: #999; display: block; margin-bottom: 8px; }
    .blog-card-body h2 { font-size: 1.15rem; font-weight: 600; margin-bottom: 10px; color: #1a2744; }
    .blog-excerpt { font-size: 0.95rem; color: #555; line-height: 1.6; }

    /* Contact */
    .contact-grid { max-width: 600px; }

    /* Footer */
    footer {
      background: #1a2744;
      color: rgba(255,255,255,0.6);
      padding: 24px;
      text-align: center;
      font-size: 0.85rem;
    }
    footer a { color: rgba(255,255,255,0.8); text-decoration: none; }
    footer a:hover { color: #fff; }

    @media (max-width: 768px) {
      .hamburger { display: block; }
      nav {
        display: none;
        position: absolute;
        top: 72px;
        left: 0;
        right: 0;
        background: #1a2744;
        flex-direction: column;
        padding: 20px 24px;
        gap: 16px;
        z-index: 100;
        box-shadow: 0 4px 12px rgba(0,0,0,0.2);
      }
      nav.open { display: flex; }
      .hero h1 { font-size: 2rem; }
      .hero { padding: 50px 24px; }
      .blog-grid { grid-template-columns: 1fr; }
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
