module.exports = {
  name: 'Restaurant',
  description: 'Warm, elegant design with menu-style layouts perfect for restaurants, cafes, and bakeries',
  thumbnail: '#8B1A1A',

  renderPage(pageName, { tenant, content, blogPosts }) {
    const subdomain = tenant.subdomain;
    const siteTitle = tenant.site_title || 'Our Restaurant';
    const tagline = tenant.site_tagline || '';

    const navLinks = [
      { href: `/site/${subdomain}/`, label: 'Home', page: 'index' },
      { href: `/site/${subdomain}/about`, label: 'Our Story', page: 'about' },
      { href: `/site/${subdomain}/services`, label: 'Menu', page: 'services' },
      { href: `/site/${subdomain}/blog`, label: 'News', page: 'blog' },
      { href: `/site/${subdomain}/contact`, label: 'Reservations', page: 'contact' }
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
            <div class="decorative-line"></div>
            <div class="ornament">&#9753;</div>
            <h1>${siteTitle}</h1>
            ${tagline ? `<p class="tagline">${tagline}</p>` : ''}
            <div class="gold-divider"></div>
            <div class="hero-buttons">
              <a href="/site/${subdomain}/services" class="btn btn-gold">View Our Menu</a>
              <a href="/site/${subdomain}/contact" class="btn btn-ghost">Reserve a Table</a>
            </div>
          </div>
        </section>
        <section class="section cream-bg">
          <div class="container">
            <div class="intro-text">
              ${content.hero || '<p class="placeholder">Send an email to update this section.</p>'}
            </div>
          </div>
        </section>
        ${content.hours ? `
        <section class="section dark-bg">
          <div class="container">
            <div class="ornament light">&#9753;</div>
            <h2 class="section-heading light">Hours &amp; Location</h2>
            <div class="gold-divider center"></div>
            <div class="hours-block">${content.hours}</div>
          </div>
        </section>` : ''}`;

        case 'about':
          return `
        <section class="page-banner">
          <div class="ornament light">&#9753;</div>
          <h1>Our Story</h1>
          <div class="gold-divider center"></div>
        </section>
        <section class="section cream-bg">
          <div class="container narrow">
            <div class="body-text">
              ${content.about || '<p class="placeholder">Send an email to update this section.</p>'}
            </div>
          </div>
        </section>`;

        case 'contact':
          return `
        <section class="page-banner">
          <div class="ornament light">&#9753;</div>
          <h1>Reservations &amp; Contact</h1>
          <div class="gold-divider center"></div>
        </section>
        <section class="section cream-bg">
          <div class="container">
            <div class="body-text">
              ${content.contact || '<p class="placeholder">Send an email to update this section.</p>'}
            </div>
            ${content.hours ? `
            <div class="hours-card">
              <div class="ornament small">&#9753;</div>
              <h3>Our Hours</h3>
              <div class="gold-divider center small"></div>
              <div class="hours-text">${content.hours}</div>
            </div>` : ''}
          </div>
        </section>`;

        case 'services':
          return `
        <section class="page-banner">
          <div class="ornament light">&#9753;</div>
          <h1>Our Menu</h1>
          <div class="gold-divider center"></div>
        </section>
        <section class="section cream-bg">
          <div class="container">
            <div class="menu-content">
              ${content.services || '<p class="placeholder">Send an email to update the menu.</p>'}
            </div>
            ${content.hours ? `
            <div class="hours-card">
              <div class="ornament small">&#9753;</div>
              <h3>Serving Hours</h3>
              <div class="gold-divider center small"></div>
              <div class="hours-text">${content.hours}</div>
            </div>` : ''}
          </div>
        </section>`;

        case 'blog':
          return `
        <section class="page-banner">
          <div class="ornament light">&#9753;</div>
          <h1>News &amp; Events</h1>
          <div class="gold-divider center"></div>
        </section>
        <section class="section cream-bg">
          <div class="container">
            ${blogPosts.length === 0
              ? '<p class="placeholder">No posts yet. Send an email with subject "Blog: Your Title" to share news.</p>'
              : blogPosts.map(post => `
                <article class="blog-post">
                  ${post.image_url ? `<img src="${post.image_url}" alt="${post.title}" class="blog-img">` : ''}
                  <div class="blog-text">
                    <time>${post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</time>
                    <h2>${post.title}</h2>
                    <div class="blog-body">${post.content}</div>
                  </div>
                </article>`).join('')}
          </div>
        </section>`;

        default:
          return `<section class="section cream-bg"><div class="container"><p>Page not found.</p></div></section>`;
      }
    }

    return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${pageName === 'index' ? siteTitle : pageName.charAt(0).toUpperCase() + pageName.slice(1) + ' - ' + siteTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=Proza+Libre:wght@400;500;600&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Proza Libre', Georgia, serif;
      background: #FFF8F0;
      color: #3D2B1F;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    img { max-width: 100%; height: auto; }
    .container { max-width: 880px; margin: 0 auto; padding: 0 24px; }
    .narrow { max-width: 720px; }

    /* Header */
    header {
      background: #8B1A1A;
      padding: 0 24px;
      border-bottom: 3px solid #D4A574;
    }
    .header-inner {
      max-width: 880px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 72px;
    }
    .logo {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.5rem;
      font-weight: 700;
      color: #FFF8F0;
      text-decoration: none;
      letter-spacing: 0.02em;
    }
    nav { display: flex; gap: 28px; }
    nav a {
      color: rgba(255, 248, 240, 0.7);
      text-decoration: none;
      font-size: 0.82rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      transition: color 0.2s;
    }
    nav a:hover, nav a.active { color: #D4A574; }
    .hamburger { display: none; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #FFF8F0; }

    /* Hero */
    .hero {
      background: #8B1A1A;
      min-height: 520px;
      display: flex;
      align-items: center;
      justify-content: center;
      text-align: center;
      position: relative;
    }
    .hero-inner { padding: 80px 24px; max-width: 680px; }
    .decorative-line {
      width: 1px;
      height: 40px;
      background: #D4A574;
      margin: 0 auto 20px;
    }
    .ornament {
      font-size: 1.8rem;
      color: #D4A574;
      margin-bottom: 16px;
    }
    .ornament.light { color: #D4A574; }
    .ornament.small { font-size: 1.2rem; margin-bottom: 10px; }
    .hero h1 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 3.8rem;
      font-weight: 700;
      color: #FFF8F0;
      line-height: 1.1;
      margin-bottom: 16px;
    }
    .tagline {
      font-size: 1.1rem;
      color: rgba(255, 248, 240, 0.75);
      line-height: 1.6;
      font-style: italic;
    }
    .gold-divider {
      width: 60px;
      height: 2px;
      background: #D4A574;
      margin: 24px 0;
    }
    .gold-divider.center { margin: 20px auto; }
    .gold-divider.small { width: 40px; margin: 12px auto; }
    .hero-buttons { display: flex; gap: 16px; justify-content: center; flex-wrap: wrap; margin-top: 12px; }

    /* Buttons */
    .btn {
      display: inline-block;
      padding: 14px 32px;
      font-size: 0.82rem;
      font-weight: 600;
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      transition: all 0.25s;
      border-radius: 2px;
    }
    .btn-gold { background: #D4A574; color: #3D2B1F; }
    .btn-gold:hover { background: #C49564; }
    .btn-ghost { border: 2px solid rgba(255,248,240,0.4); color: #FFF8F0; background: transparent; }
    .btn-ghost:hover { border-color: #FFF8F0; }

    /* Page Banner */
    .page-banner {
      background: #8B1A1A;
      padding: 64px 24px;
      text-align: center;
    }
    .page-banner h1 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 2.8rem;
      font-weight: 700;
      color: #FFF8F0;
    }

    /* Sections */
    .section { padding: 64px 0; }
    .cream-bg { background: #FFF8F0; flex: 1; }
    .dark-bg { background: #3D2B1F; color: #FFF8F0; }
    .section-heading {
      font-family: 'Cormorant Garamond', serif;
      font-size: 2rem;
      text-align: center;
      margin-bottom: 8px;
      color: #3D2B1F;
    }
    .section-heading.light { color: #FFF8F0; }

    /* Content */
    .intro-text {
      text-align: center;
      line-height: 1.9;
      font-size: 1.05rem;
      color: #5A4636;
      max-width: 680px;
      margin: 0 auto;
    }
    .body-text { line-height: 1.9; font-size: 1.05rem; color: #5A4636; }
    .placeholder { color: #B5A08A; text-align: center; font-style: italic; padding: 20px 0; }

    /* Menu Content */
    .menu-content {
      line-height: 2;
      font-size: 1.05rem;
      color: #5A4636;
    }
    .menu-content h1, .menu-content h2, .menu-content h3 {
      font-family: 'Cormorant Garamond', serif;
      color: #8B1A1A;
      margin-top: 36px;
      margin-bottom: 12px;
      padding-bottom: 8px;
      border-bottom: 1px solid #D4A574;
    }

    /* Hours */
    .hours-block { text-align: center; line-height: 2; font-size: 1.05rem; }
    .hours-card {
      margin-top: 48px;
      padding: 36px;
      background: #fff;
      border: 1px solid #E8DDD0;
      text-align: center;
      border-top: 3px solid #D4A574;
    }
    .hours-card h3 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.4rem;
      color: #8B1A1A;
      margin-bottom: 4px;
    }
    .hours-text { line-height: 1.9; color: #5A4636; }

    /* Blog */
    .blog-post {
      margin-bottom: 48px;
      padding-bottom: 48px;
      border-bottom: 1px solid #E8DDD0;
      display: flex;
      gap: 28px;
      align-items: flex-start;
    }
    .blog-img { width: 260px; height: 190px; object-fit: cover; flex-shrink: 0; }
    .blog-text { flex: 1; }
    .blog-text time {
      font-size: 0.78rem;
      color: #B5A08A;
      display: block;
      margin-bottom: 8px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
    }
    .blog-text h2 {
      font-family: 'Cormorant Garamond', serif;
      font-size: 1.5rem;
      color: #3D2B1F;
      margin-bottom: 12px;
    }
    .blog-body { line-height: 1.8; color: #5A4636; font-size: 0.95rem; }

    /* Footer */
    footer {
      background: #3D2B1F;
      color: rgba(255,248,240,0.5);
      padding: 28px 24px;
      text-align: center;
      font-size: 0.8rem;
    }
    footer a { color: rgba(255,248,240,0.7); text-decoration: none; }
    footer a:hover { color: #FFF8F0; }

    main { flex: 1; display: flex; flex-direction: column; }

    @media (max-width: 768px) {
      .hamburger { display: block; }
      nav {
        display: none;
        position: absolute;
        top: 72px;
        left: 0;
        right: 0;
        background: #8B1A1A;
        flex-direction: column;
        padding: 20px 24px;
        gap: 16px;
        z-index: 100;
        border-bottom: 3px solid #D4A574;
      }
      nav.open { display: flex; }
      .hero h1 { font-size: 2.6rem; }
      .hero { min-height: 400px; }
      .page-banner h1 { font-size: 2rem; }
      .blog-post { flex-direction: column; }
      .blog-img { width: 100%; height: 200px; }
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
