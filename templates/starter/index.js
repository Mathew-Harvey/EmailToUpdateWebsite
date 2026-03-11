const { escapeHtml } = require('../_helpers');

module.exports = {
  name: 'Starter',
  description: 'Clean, minimal white design perfect for anyone starting out',
  thumbnail: '#ffffff',

  renderPage(pageName, { tenant, content, blogPosts }) {
    const subdomain = tenant.subdomain;
    const siteTitle = escapeHtml(tenant.site_title || 'My Website');
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
      return `<a href="${link.href}" style="${isActive ? 'color: #111; font-weight: 600;' : ''}">${link.label}</a>`;
    }).join('\n          ');

    function getPageContent() {
      switch (pageName) {
        case 'index':
          return `
        <section style="text-align: center; padding: 80px 20px 60px;">
          <h1 style="font-size: 3rem; font-weight: 700; color: #111; margin-bottom: 16px; letter-spacing: -0.02em;">${siteTitle}</h1>
          ${tagline ? `<p style="font-size: 1.25rem; color: #666; max-width: 600px; margin: 0 auto 32px; line-height: 1.6;">${tagline}</p>` : ''}
          <a href="/site/${subdomain}/contact" style="display: inline-block; padding: 14px 32px; background: #111; color: #fff; text-decoration: none; border-radius: 6px; font-weight: 500; font-size: 0.95rem; transition: background 0.2s;">Get in Touch</a>
        </section>
        <section style="max-width: 720px; margin: 0 auto; padding: 0 20px 60px;">
          <div style="line-height: 1.8; color: #444; font-size: 1.05rem;">
            ${content.hero || '<p style="color: #999; text-align: center;">Send an email to update this section.</p>'}
          </div>
        </section>`;

        case 'about':
          return `
        <section style="max-width: 720px; margin: 0 auto; padding: 60px 20px;">
          <h1 style="font-size: 2.25rem; font-weight: 700; color: #111; margin-bottom: 24px; letter-spacing: -0.02em;">About</h1>
          <div style="line-height: 1.8; color: #444; font-size: 1.05rem;">
            ${content.about || '<p style="color: #999;">Send an email to update this section.</p>'}
          </div>
        </section>`;

        case 'contact':
          return `
        <section style="max-width: 720px; margin: 0 auto; padding: 60px 20px;">
          <h1 style="font-size: 2.25rem; font-weight: 700; color: #111; margin-bottom: 24px; letter-spacing: -0.02em;">Contact</h1>
          <div style="line-height: 1.8; color: #444; font-size: 1.05rem;">
            ${content.contact || '<p style="color: #999;">Send an email to update this section.</p>'}
          </div>
        </section>`;

        case 'services':
          return `
        <section style="max-width: 720px; margin: 0 auto; padding: 60px 20px;">
          <h1 style="font-size: 2.25rem; font-weight: 700; color: #111; margin-bottom: 24px; letter-spacing: -0.02em;">Services</h1>
          <div style="line-height: 1.8; color: #444; font-size: 1.05rem; margin-bottom: 40px;">
            ${content.services || '<p style="color: #999;">Send an email to update this section.</p>'}
          </div>
          ${content.hours ? `
          <div style="border-top: 1px solid #eee; padding-top: 32px;">
            <h2 style="font-size: 1.5rem; font-weight: 600; color: #111; margin-bottom: 16px;">Hours</h2>
            <div style="line-height: 1.8; color: #444;">${content.hours}</div>
          </div>` : ''}
        </section>`;

        case 'blog':
          return `
        <section style="max-width: 720px; margin: 0 auto; padding: 60px 20px;">
          <h1 style="font-size: 2.25rem; font-weight: 700; color: #111; margin-bottom: 32px; letter-spacing: -0.02em;">Blog</h1>
          ${blogPosts.length === 0 ? '<p style="color: #999;">No posts yet. Send an email with subject "Blog: Your Title" to create a post.</p>' :
            blogPosts.map(post => `
            <article style="margin-bottom: 48px; padding-bottom: 48px; border-bottom: 1px solid #eee;">
              ${post.image_url ? `<img src="${post.image_url}" alt="${post.title}" style="width: 100%; height: 300px; object-fit: cover; border-radius: 8px; margin-bottom: 20px;">` : ''}
              <h2 style="font-size: 1.5rem; font-weight: 600; color: #111; margin-bottom: 8px;">${post.title}</h2>
              <time style="font-size: 0.85rem; color: #999; display: block; margin-bottom: 16px;">${post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</time>
              <div style="line-height: 1.8; color: #444;">${post.content}</div>
            </article>`).join('')}
        </section>`;

        default:
          return `<section style="max-width: 720px; margin: 0 auto; padding: 60px 20px;"><p>Page not found.</p></section>`;
      }
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageName === 'index' ? siteTitle : pageName.charAt(0).toUpperCase() + pageName.slice(1) + ' - ' + siteTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Inter', -apple-system, BlinkMacSystemFont, sans-serif;
      background: #fff;
      color: #333;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    img { max-width: 100%; height: auto; }
    header {
      border-bottom: 1px solid #f0f0f0;
      padding: 0 20px;
    }
    .header-inner {
      max-width: 720px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
    }
    .logo {
      font-size: 1.1rem;
      font-weight: 700;
      color: #111;
      text-decoration: none;
    }
    nav { display: flex; gap: 24px; }
    nav a {
      color: #666;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 500;
      transition: color 0.2s;
    }
    nav a:hover { color: #111; }
    main { flex: 1; }
    footer {
      border-top: 1px solid #f0f0f0;
      padding: 24px 20px;
      text-align: center;
      font-size: 0.8rem;
      color: #aaa;
    }
    footer a { color: #888; text-decoration: none; }
    footer a:hover { color: #555; }
    .hamburger { display: none; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #111; }
    @media (max-width: 640px) {
      .hamburger { display: block; }
      nav {
        display: none;
        position: absolute;
        top: 64px;
        left: 0;
        right: 0;
        background: #fff;
        flex-direction: column;
        padding: 20px;
        gap: 16px;
        border-bottom: 1px solid #f0f0f0;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
        z-index: 100;
      }
      nav.open { display: flex; }
      nav a { font-size: 1rem; }
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
  <main>
    ${getPageContent()}
  </main>
  <footer>
    <p>Powered by <a href="/">EmailSite</a></p>
  </footer>
</body>
</html>`;
  }
};
