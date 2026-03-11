const { escapeHtml } = require('../_helpers');

module.exports = {
  name: 'Personal',
  description: 'Warm, cozy blog-focused layout with rich typography for personal brands and writers',
  thumbnail: '#78350F',

  renderPage(pageName, { tenant, content, blogPosts }) {
    const subdomain = tenant.subdomain;
    const siteTitle = escapeHtml(tenant.site_title || 'My Site');
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
        <div class="layout">
          <div class="main-col">
            <section class="hero-section">
              <h1>${siteTitle}</h1>
              ${tagline ? `<p class="tagline">${tagline}</p>` : ''}
              <div class="divider"></div>
            </section>
            <section class="content-section">
              <div class="prose">
                ${content.hero || '<p class="placeholder">Send an email to update this section.</p>'}
              </div>
            </section>
            ${blogPosts.length > 0 ? `
            <section class="content-section">
              <h2 class="section-heading">Latest Posts</h2>
              <div class="divider short"></div>
              ${blogPosts.slice(0, 3).map(post => `
              <article class="post-preview">
                <time>${post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</time>
                <h3><a href="/site/${subdomain}/blog">${post.title}</a></h3>
                <p class="post-excerpt">${post.content.replace(/<[^>]*>/g, '').substring(0, 160)}...</p>
              </article>`).join('')}
              <a href="/site/${subdomain}/blog" class="read-more-link">View all posts &rarr;</a>
            </section>` : ''}
          </div>
          <aside class="sidebar">
            <div class="sidebar-block">
              <h3>About</h3>
              <div class="sidebar-text">
                ${content.about ? content.about.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : 'Send an email to update this section.'}
              </div>
              <a href="/site/${subdomain}/about" class="sidebar-link">Read more &rarr;</a>
            </div>
            ${content.hours ? `
            <div class="sidebar-block">
              <h3>Hours</h3>
              <div class="sidebar-text">${content.hours}</div>
            </div>` : ''}
            <div class="sidebar-block">
              <h3>Connect</h3>
              <a href="/site/${subdomain}/contact" class="btn btn-warm">Get in Touch</a>
            </div>
          </aside>
        </div>`;

        case 'about':
          return `
        <div class="layout">
          <div class="main-col">
            <section class="page-top">
              <h1>About</h1>
              <div class="divider"></div>
            </section>
            <section class="content-section">
              <div class="prose">
                ${content.about || '<p class="placeholder">Send an email to update this section.</p>'}
              </div>
            </section>
          </div>
          <aside class="sidebar">
            ${content.hours ? `
            <div class="sidebar-block">
              <h3>Hours</h3>
              <div class="sidebar-text">${content.hours}</div>
            </div>` : ''}
            <div class="sidebar-block">
              <h3>Connect</h3>
              <a href="/site/${subdomain}/contact" class="btn btn-warm">Get in Touch</a>
            </div>
          </aside>
        </div>`;

        case 'contact':
          return `
        <div class="layout">
          <div class="main-col">
            <section class="page-top">
              <h1>Contact</h1>
              <div class="divider"></div>
            </section>
            <section class="content-section">
              <div class="prose">
                ${content.contact || '<p class="placeholder">Send an email to update this section.</p>'}
              </div>
            </section>
          </div>
          <aside class="sidebar">
            ${content.hours ? `
            <div class="sidebar-block">
              <h3>Hours</h3>
              <div class="sidebar-text">${content.hours}</div>
            </div>` : ''}
          </aside>
        </div>`;

        case 'services':
          return `
        <div class="layout">
          <div class="main-col">
            <section class="page-top">
              <h1>Services</h1>
              <div class="divider"></div>
            </section>
            <section class="content-section">
              <div class="prose">
                ${content.services || '<p class="placeholder">Send an email to update this section.</p>'}
              </div>
            </section>
          </div>
          <aside class="sidebar">
            ${content.hours ? `
            <div class="sidebar-block">
              <h3>Availability</h3>
              <div class="sidebar-text">${content.hours}</div>
            </div>` : ''}
            <div class="sidebar-block">
              <h3>Connect</h3>
              <a href="/site/${subdomain}/contact" class="btn btn-warm">Get in Touch</a>
            </div>
          </aside>
        </div>`;

        case 'blog':
          return `
        <div class="layout">
          <div class="main-col">
            <section class="page-top">
              <h1>Blog</h1>
              <div class="divider"></div>
            </section>
            <section class="content-section">
              ${blogPosts.length === 0
                ? '<p class="placeholder">No posts yet. Send an email with subject "Blog: Your Title" to publish a post.</p>'
                : blogPosts.map(post => `
                <article class="blog-post">
                  ${post.image_url ? `<img src="${post.image_url}" alt="${post.title}" class="blog-img">` : ''}
                  <time>${post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</time>
                  <h2>${post.title}</h2>
                  <div class="prose">${post.content}</div>
                  <div class="post-divider"></div>
                </article>`).join('')}
            </section>
          </div>
          <aside class="sidebar">
            <div class="sidebar-block">
              <h3>About</h3>
              <div class="sidebar-text">
                ${content.about ? content.about.replace(/<[^>]*>/g, '').substring(0, 200) + '...' : 'Send an email to update this section.'}
              </div>
              <a href="/site/${subdomain}/about" class="sidebar-link">Read more &rarr;</a>
            </div>
          </aside>
        </div>`;

        default:
          return `<div class="layout"><div class="main-col"><p>Page not found.</p></div></div>`;
      }
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageName === 'index' ? siteTitle : pageName.charAt(0).toUpperCase() + pageName.slice(1) + ' - ' + siteTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Merriweather:wght@300;400;700;900&family=Open+Sans:wght@300;400;500;600;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Open Sans', sans-serif;
      background: #FFFBEB;
      color: #44403C;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    img { max-width: 100%; height: auto; }

    /* Header */
    header {
      background: #78350F;
      padding: 0 24px;
      border-bottom: 3px solid #92400E;
    }
    .header-inner {
      max-width: 1060px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
    }
    .logo {
      font-family: 'Merriweather', serif;
      font-size: 1.2rem;
      font-weight: 900;
      color: #FFFBEB;
      text-decoration: none;
    }
    nav { display: flex; gap: 24px; }
    nav a {
      color: rgba(255,251,235,0.7);
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 600;
      transition: color 0.2s;
    }
    nav a:hover, nav a.active { color: #FFFBEB; }
    .hamburger { display: none; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #FFFBEB; }

    /* Layout */
    .layout {
      max-width: 1060px;
      margin: 0 auto;
      padding: 40px 24px;
      display: grid;
      grid-template-columns: 1fr 300px;
      gap: 48px;
      flex: 1;
    }
    .main-col { min-width: 0; }

    /* Hero / Page Top */
    .hero-section {
      margin-bottom: 32px;
    }
    .hero-section h1, .page-top h1 {
      font-family: 'Merriweather', serif;
      font-size: 2.5rem;
      font-weight: 900;
      color: #78350F;
      line-height: 1.25;
      margin-bottom: 12px;
    }
    .page-top {
      margin-bottom: 24px;
    }
    .page-top h1 {
      font-size: 2.2rem;
    }
    .tagline {
      font-size: 1.1rem;
      color: #92400E;
      line-height: 1.7;
      font-weight: 300;
    }
    .divider {
      width: 60px;
      height: 3px;
      background: #92400E;
      margin-top: 20px;
      border-radius: 2px;
    }
    .divider.short { width: 40px; margin-top: 8px; margin-bottom: 24px; }

    /* Content */
    .content-section { margin-bottom: 40px; }
    .section-heading {
      font-family: 'Merriweather', serif;
      font-size: 1.5rem;
      font-weight: 700;
      color: #78350F;
      margin-bottom: 4px;
    }
    .prose {
      line-height: 1.9;
      font-size: 1.02rem;
      color: #57534E;
    }
    .prose h1, .prose h2, .prose h3 {
      font-family: 'Merriweather', serif;
      color: #78350F;
      margin-top: 28px;
      margin-bottom: 12px;
    }
    .prose p { margin-bottom: 16px; }
    .placeholder { color: #A8A29E; text-align: center; padding: 28px 0; font-style: italic; }

    /* Post Preview (home page) */
    .post-preview {
      margin-bottom: 28px;
      padding-bottom: 28px;
      border-bottom: 1px solid #E7E5E4;
    }
    .post-preview time {
      font-size: 0.78rem;
      color: #A8A29E;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 6px;
    }
    .post-preview h3 { font-family: 'Merriweather', serif; font-size: 1.2rem; font-weight: 700; margin-bottom: 8px; }
    .post-preview h3 a { color: #78350F; text-decoration: none; }
    .post-preview h3 a:hover { color: #92400E; text-decoration: underline; }
    .post-excerpt { font-size: 0.92rem; color: #78716C; line-height: 1.7; }
    .read-more-link {
      color: #92400E;
      font-size: 0.9rem;
      font-weight: 600;
      text-decoration: none;
    }
    .read-more-link:hover { text-decoration: underline; }

    /* Blog Post (full) */
    .blog-post { margin-bottom: 48px; }
    .blog-post time {
      font-size: 0.78rem;
      color: #A8A29E;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      display: block;
      margin-bottom: 8px;
    }
    .blog-post h2 {
      font-family: 'Merriweather', serif;
      font-size: 1.6rem;
      font-weight: 700;
      color: #78350F;
      margin-bottom: 16px;
      line-height: 1.3;
    }
    .blog-img {
      width: 100%;
      height: 320px;
      object-fit: cover;
      border-radius: 8px;
      margin-bottom: 16px;
    }
    .post-divider {
      width: 100%;
      height: 1px;
      background: #E7E5E4;
      margin-top: 32px;
    }

    /* Sidebar */
    .sidebar {}
    .sidebar-block {
      background: #fff;
      border: 1px solid #E7E5E4;
      border-radius: 10px;
      padding: 24px;
      margin-bottom: 20px;
    }
    .sidebar-block h3 {
      font-family: 'Merriweather', serif;
      font-size: 1rem;
      font-weight: 700;
      color: #78350F;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 2px solid #92400E;
    }
    .sidebar-text {
      font-size: 0.88rem;
      line-height: 1.7;
      color: #78716C;
    }
    .sidebar-link {
      display: inline-block;
      margin-top: 10px;
      font-size: 0.85rem;
      color: #92400E;
      text-decoration: none;
      font-weight: 600;
    }
    .sidebar-link:hover { text-decoration: underline; }

    /* Buttons */
    .btn {
      display: inline-block;
      padding: 12px 24px;
      border-radius: 6px;
      font-size: 0.88rem;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s;
    }
    .btn-warm {
      background: #78350F;
      color: #FFFBEB;
    }
    .btn-warm:hover { background: #92400E; }

    /* Footer */
    footer {
      background: #78350F;
      color: rgba(255,251,235,0.5);
      padding: 24px;
      text-align: center;
      font-size: 0.8rem;
    }
    footer a { color: rgba(255,251,235,0.7); text-decoration: none; }
    footer a:hover { color: #FFFBEB; }

    @media (max-width: 840px) {
      .layout {
        grid-template-columns: 1fr;
        gap: 32px;
        padding: 28px 20px;
      }
      .hamburger { display: block; }
      nav {
        display: none;
        position: absolute;
        top: 64px;
        left: 0;
        right: 0;
        background: #78350F;
        flex-direction: column;
        padding: 20px 24px;
        gap: 14px;
        z-index: 100;
        border-bottom: 3px solid #92400E;
      }
      nav.open { display: flex; }
      .hero-section h1 { font-size: 1.9rem; }
      .blog-img { height: 220px; }
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
