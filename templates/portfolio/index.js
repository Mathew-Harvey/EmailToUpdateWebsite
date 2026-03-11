module.exports = {
  name: 'Portfolio',
  description: 'Creative, bold design with large typography for creatives and photographers',
  thumbnail: '#2c2c2c',

  renderPage(pageName, { tenant, content, blogPosts }) {
    const subdomain = tenant.subdomain;
    const siteTitle = tenant.site_title || 'My Portfolio';
    const tagline = tenant.tagline || '';

    const navLinks = [
      { href: `/site/${subdomain}/`, label: 'Home' },
      { href: `/site/${subdomain}/about`, label: 'About' },
      { href: `/site/${subdomain}/services`, label: 'Services' },
      { href: `/site/${subdomain}/blog`, label: 'Work' },
      { href: `/site/${subdomain}/contact`, label: 'Contact' }
    ];

    const nav = navLinks.map(link => {
      const isActive = (pageName === 'index' && link.label === 'Home') ||
                        (pageName === 'blog' && link.label === 'Work') ||
                        link.label.toLowerCase() === pageName;
      return `<a href="${link.href}" class="${isActive ? 'active' : ''}">${link.label}</a>`;
    }).join('\n            ');

    function getPageContent() {
      switch (pageName) {
        case 'index':
          return `
        <section class="hero">
          <div class="hero-content">
            <span class="hero-label">Welcome</span>
            <h1>${siteTitle}</h1>
            ${tagline ? `<p class="tagline">${tagline}</p>` : ''}
            <a href="/site/${subdomain}/blog" class="btn">View My Work</a>
          </div>
        </section>
        <section class="section">
          <div class="container">
            <div class="intro-text">
              ${content.hero || '<p class="placeholder">Send an email to update this section.</p>'}
            </div>
          </div>
        </section>`;

        case 'about':
          return `
        <section class="section">
          <div class="container">
            <h1 class="page-title">About<span class="dot">.</span></h1>
            <div class="two-col">
              <div class="col-text">
                ${content.about || '<p class="placeholder">Send an email to update this section.</p>'}
              </div>
            </div>
          </div>
        </section>`;

        case 'contact':
          return `
        <section class="section">
          <div class="container">
            <h1 class="page-title">Get in Touch<span class="dot">.</span></h1>
            <div class="contact-content">
              ${content.contact || '<p class="placeholder">Send an email to update this section.</p>'}
            </div>
          </div>
        </section>`;

        case 'services':
          return `
        <section class="section">
          <div class="container">
            <h1 class="page-title">Services<span class="dot">.</span></h1>
            <div class="services-content">
              ${content.services || '<p class="placeholder">Send an email to update this section.</p>'}
            </div>
            ${content.hours ? `
            <div class="hours-section">
              <h2>Availability</h2>
              ${content.hours}
            </div>` : ''}
          </div>
        </section>`;

        case 'blog':
          return `
        <section class="section">
          <div class="container">
            <h1 class="page-title">Work<span class="dot">.</span></h1>
            ${blogPosts.length === 0
              ? '<p class="placeholder">No posts yet. Send an email with subject "Blog: Your Title" to share your work.</p>'
              : `<div class="masonry">${blogPosts.map(post => `
                <article class="masonry-item">
                  ${post.image_url ? `<img src="${post.image_url}" alt="${post.title}">` : ''}
                  <div class="masonry-overlay">
                    <h2>${post.title}</h2>
                    <time>${post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short' }) : ''}</time>
                  </div>
                  <div class="masonry-body">
                    <div class="post-content">${post.content}</div>
                  </div>
                </article>`).join('')}</div>`}
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
  <title>${pageName === 'index' ? siteTitle : (pageName === 'blog' ? 'Work' : pageName.charAt(0).toUpperCase() + pageName.slice(1)) + ' - ' + siteTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;700;900&family=Source+Sans+Pro:wght@300;400;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Source Sans Pro', sans-serif;
      background: #fafafa;
      color: #333;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    img { max-width: 100%; height: auto; }
    .container { max-width: 1100px; margin: 0 auto; padding: 0 24px; }

    /* Header */
    header {
      padding: 0 24px;
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 1000;
      background: rgba(250,250,250,0.95);
      backdrop-filter: blur(10px);
      border-bottom: 1px solid rgba(0,0,0,0.05);
    }
    .header-inner {
      max-width: 1100px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 72px;
    }
    .logo {
      font-family: 'Playfair Display', serif;
      font-size: 1.5rem;
      font-weight: 900;
      color: #2c2c2c;
      text-decoration: none;
    }
    nav { display: flex; gap: 32px; }
    nav a {
      color: #888;
      text-decoration: none;
      font-size: 0.9rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      transition: color 0.2s;
    }
    nav a:hover, nav a.active { color: #2c2c2c; }
    .hamburger { display: none; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #2c2c2c; }

    /* Hero */
    .hero {
      padding: 160px 24px 100px;
      text-align: left;
      margin-top: 72px;
    }
    .hero-content { max-width: 800px; margin: 0 auto; }
    .hero-label {
      font-size: 0.85rem;
      text-transform: uppercase;
      letter-spacing: 0.15em;
      color: #999;
      display: block;
      margin-bottom: 16px;
      font-weight: 600;
    }
    .hero h1 {
      font-family: 'Playfair Display', serif;
      font-size: 4.5rem;
      font-weight: 900;
      color: #2c2c2c;
      line-height: 1.1;
      margin-bottom: 20px;
    }
    .hero .tagline {
      font-size: 1.3rem;
      color: #777;
      max-width: 500px;
      line-height: 1.6;
      font-weight: 300;
      margin-bottom: 32px;
    }
    .btn {
      display: inline-block;
      padding: 14px 32px;
      background: #2c2c2c;
      color: #fff;
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      transition: background 0.2s;
    }
    .btn:hover { background: #444; }

    /* Sections */
    .section { padding: 80px 0; flex: 1; }
    .section:first-child { margin-top: 72px; }
    .page-title {
      font-family: 'Playfair Display', serif;
      font-size: 3.5rem;
      font-weight: 900;
      color: #2c2c2c;
      margin-bottom: 40px;
    }
    .dot { color: #c9a96e; }
    .intro-text { font-size: 1.15rem; line-height: 1.9; color: #555; max-width: 700px; }
    .two-col { display: grid; grid-template-columns: 1fr; gap: 40px; }
    .col-text { line-height: 1.9; color: #555; font-size: 1.05rem; }
    .contact-content { line-height: 1.9; color: #555; font-size: 1.05rem; max-width: 600px; }
    .services-content { line-height: 1.9; color: #555; font-size: 1.05rem; }
    .hours-section {
      margin-top: 48px;
      padding-top: 32px;
      border-top: 2px solid #2c2c2c;
    }
    .hours-section h2 {
      font-family: 'Playfair Display', serif;
      font-size: 1.5rem;
      margin-bottom: 16px;
      color: #2c2c2c;
    }
    .placeholder { color: #bbb; font-style: italic; }

    /* Masonry Blog */
    .masonry {
      columns: 2;
      column-gap: 24px;
    }
    .masonry-item {
      break-inside: avoid;
      margin-bottom: 24px;
      background: #fff;
      border-radius: 4px;
      overflow: hidden;
      box-shadow: 0 2px 12px rgba(0,0,0,0.06);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .masonry-item:hover { transform: translateY(-4px); box-shadow: 0 8px 24px rgba(0,0,0,0.1); }
    .masonry-item img { width: 100%; display: block; }
    .masonry-overlay {
      padding: 20px;
      border-bottom: 1px solid #f0f0f0;
    }
    .masonry-overlay h2 {
      font-family: 'Playfair Display', serif;
      font-size: 1.3rem;
      font-weight: 700;
      color: #2c2c2c;
      margin-bottom: 4px;
    }
    .masonry-overlay time { font-size: 0.8rem; color: #aaa; }
    .masonry-body { padding: 20px; line-height: 1.7; color: #555; font-size: 0.95rem; }

    /* Footer */
    footer {
      padding: 32px 24px;
      text-align: center;
      font-size: 0.8rem;
      color: #bbb;
      border-top: 1px solid #eee;
    }
    footer a { color: #999; text-decoration: none; }
    footer a:hover { color: #555; }

    @media (max-width: 768px) {
      .hamburger { display: block; }
      nav {
        display: none;
        position: absolute;
        top: 72px;
        left: 0;
        right: 0;
        background: rgba(250,250,250,0.98);
        flex-direction: column;
        padding: 24px;
        gap: 16px;
        z-index: 100;
        box-shadow: 0 4px 12px rgba(0,0,0,0.05);
      }
      nav.open { display: flex; }
      .hero h1 { font-size: 2.8rem; }
      .hero { padding: 120px 24px 60px; }
      .page-title { font-size: 2.5rem; }
      .masonry { columns: 1; }
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
