module.exports = {
  name: 'Retail',
  description: 'Bright, energetic pink and purple design with bold cards for shops and boutiques',
  thumbnail: '#EC4899',

  renderPage(pageName, { tenant, content, blogPosts }) {
    const subdomain = tenant.subdomain;
    const siteTitle = tenant.site_title || 'Our Shop';
    const tagline = tenant.site_tagline || '';

    const navLinks = [
      { href: `/site/${subdomain}/`, label: 'Home', page: 'index' },
      { href: `/site/${subdomain}/about`, label: 'About', page: 'about' },
      { href: `/site/${subdomain}/services`, label: 'Products', page: 'services' },
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
            <span class="hero-badge">Welcome</span>
            <h1>${siteTitle}</h1>
            ${tagline ? `<p class="tagline">${tagline}</p>` : ''}
            <div class="hero-buttons">
              <a href="/site/${subdomain}/services" class="btn btn-white">Shop Now</a>
              <a href="/site/${subdomain}/about" class="btn btn-ghost">Learn More</a>
            </div>
          </div>
        </section>
        <section class="section">
          <div class="container">
            <div class="intro-content">
              ${content.hero || '<p class="placeholder">Send an email to update this section.</p>'}
            </div>
          </div>
        </section>
        ${content.hours ? `
        <section class="section bg-purple">
          <div class="container">
            <h2 class="section-heading white">Store Hours</h2>
            <div class="hours-card">
              ${content.hours}
            </div>
          </div>
        </section>` : ''}`;

        case 'about':
          return `
        <section class="page-banner">
          <div class="container">
            <h1>About Us</h1>
            <p class="page-sub">Our story and what makes us special</p>
          </div>
        </section>
        <section class="section">
          <div class="container">
            <div class="card-content">
              ${content.about || '<p class="placeholder">Send an email to update this section.</p>'}
            </div>
          </div>
        </section>`;

        case 'contact':
          return `
        <section class="page-banner">
          <div class="container">
            <h1>Contact Us</h1>
            <p class="page-sub">We would love to hear from you</p>
          </div>
        </section>
        <section class="section">
          <div class="container">
            <div class="contact-grid">
              <div class="contact-card pink-border">
                <div class="contact-icon">&#9993;</div>
                <h3>Get in Touch</h3>
                <div class="contact-info">
                  ${content.contact || '<p class="placeholder">Send an email to update this section.</p>'}
                </div>
              </div>
              ${content.hours ? `
              <div class="contact-card purple-border">
                <div class="contact-icon">&#128339;</div>
                <h3>Store Hours</h3>
                <div class="contact-info">${content.hours}</div>
              </div>` : ''}
            </div>
          </div>
        </section>`;

        case 'services':
          return `
        <section class="page-banner">
          <div class="container">
            <h1>Our Products</h1>
            <p class="page-sub">Discover what we have to offer</p>
          </div>
        </section>
        <section class="section">
          <div class="container">
            <div class="card-content">
              ${content.services || '<p class="placeholder">Send an email to update this section.</p>'}
            </div>
            ${content.hours ? `
            <div class="hours-inline">
              <h3>Store Hours</h3>
              ${content.hours}
            </div>` : ''}
          </div>
        </section>`;

        case 'blog':
          return `
        <section class="page-banner">
          <div class="container">
            <h1>Blog</h1>
            <p class="page-sub">News, updates, and inspiration</p>
          </div>
        </section>
        <section class="section">
          <div class="container">
            ${blogPosts.length === 0
              ? '<p class="placeholder">No posts yet. Send an email with subject "Blog: Your Title" to create a post.</p>'
              : `<div class="blog-grid">${blogPosts.map(post => `
                <article class="blog-card">
                  ${post.image_url ? `<img src="${post.image_url}" alt="${post.title}" class="blog-card-img">` : '<div class="blog-card-img-placeholder"></div>'}
                  <div class="blog-card-body">
                    <span class="blog-tag">New</span>
                    <h2>${post.title}</h2>
                    <time>${post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' }) : ''}</time>
                    <div class="blog-card-text">${post.content}</div>
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
  <title>${pageName === 'index' ? siteTitle : (pageName === 'services' ? 'Products' : pageName.charAt(0).toUpperCase() + pageName.slice(1)) + ' - ' + siteTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Poppins:wght@300;400;500;600;700;800&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Poppins', sans-serif;
      background: #fff;
      color: #333;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    img { max-width: 100%; height: auto; }
    .container { max-width: 1000px; margin: 0 auto; padding: 0 24px; }

    /* Header */
    header {
      background: #fff;
      padding: 0 24px;
      box-shadow: 0 2px 12px rgba(236,72,153,0.08);
      position: sticky;
      top: 0;
      z-index: 100;
    }
    .header-inner {
      max-width: 1000px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 64px;
    }
    .logo {
      font-size: 1.25rem;
      font-weight: 800;
      background: linear-gradient(135deg, #EC4899, #8B5CF6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      text-decoration: none;
    }
    nav { display: flex; gap: 24px; }
    nav a {
      color: #666;
      text-decoration: none;
      font-size: 0.85rem;
      font-weight: 600;
      transition: color 0.2s;
    }
    nav a:hover, nav a.active { color: #EC4899; }
    .hamburger { display: none; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #EC4899; }

    /* Hero */
    .hero {
      background: linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%);
      color: #fff;
      padding: 80px 24px;
      text-align: center;
    }
    .hero-badge {
      display: inline-block;
      background: rgba(255,255,255,0.2);
      color: #fff;
      font-size: 0.75rem;
      font-weight: 700;
      padding: 6px 16px;
      border-radius: 50px;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 20px;
    }
    .hero h1 { font-size: 3.2rem; font-weight: 800; margin-bottom: 12px; line-height: 1.1; }
    .hero .tagline { font-size: 1.15rem; opacity: 0.9; margin-bottom: 32px; font-weight: 400; max-width: 600px; margin-left: auto; margin-right: auto; line-height: 1.6; }
    .hero-buttons { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }

    /* Buttons */
    .btn {
      display: inline-block;
      padding: 14px 36px;
      border-radius: 50px;
      font-size: 0.9rem;
      font-weight: 700;
      text-decoration: none;
      transition: all 0.25s;
    }
    .btn-white {
      background: #fff;
      color: #EC4899;
      box-shadow: 0 4px 16px rgba(0,0,0,0.1);
    }
    .btn-white:hover { transform: translateY(-2px); box-shadow: 0 6px 24px rgba(0,0,0,0.15); }
    .btn-ghost {
      background: transparent;
      color: #fff;
      border: 2px solid rgba(255,255,255,0.4);
    }
    .btn-ghost:hover { border-color: #fff; }

    /* Page Banner */
    .page-banner {
      background: linear-gradient(135deg, #EC4899 0%, #8B5CF6 100%);
      color: #fff;
      padding: 52px 24px;
      text-align: center;
    }
    .page-banner h1 { font-size: 2.25rem; font-weight: 800; margin-bottom: 8px; }
    .page-sub { font-size: 1rem; opacity: 0.85; font-weight: 400; }

    /* Sections */
    .section { padding: 52px 0; flex: 1; }
    .bg-purple { background: #8B5CF6; color: #fff; }
    .section-heading {
      text-align: center;
      font-size: 1.5rem;
      font-weight: 700;
      color: #333;
      margin-bottom: 24px;
    }
    .section-heading.white { color: #fff; }
    .card-content {
      line-height: 1.9;
      font-size: 1rem;
      color: #555;
    }
    .intro-content {
      line-height: 1.9;
      font-size: 1.05rem;
      color: #555;
      max-width: 720px;
      margin: 0 auto;
    }
    .placeholder { color: #ccc; text-align: center; padding: 32px 0; font-style: italic; }

    /* Contact Grid */
    .contact-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
      gap: 24px;
    }
    .contact-card {
      background: #fff;
      border-radius: 20px;
      padding: 36px;
      text-align: center;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      transition: transform 0.2s;
    }
    .contact-card:hover { transform: translateY(-4px); }
    .contact-card.pink-border { border-top: 4px solid #EC4899; }
    .contact-card.purple-border { border-top: 4px solid #8B5CF6; }
    .contact-icon { font-size: 2rem; margin-bottom: 12px; }
    .contact-card h3 { font-size: 1.15rem; font-weight: 700; color: #333; margin-bottom: 12px; }
    .contact-info { font-size: 0.95rem; line-height: 1.8; color: #666; }

    /* Hours */
    .hours-card {
      max-width: 420px;
      margin: 0 auto;
      background: rgba(255,255,255,0.15);
      border-radius: 20px;
      padding: 32px;
      text-align: center;
      line-height: 1.9;
      backdrop-filter: blur(4px);
    }
    .hours-inline {
      margin-top: 40px;
      padding: 28px;
      background: linear-gradient(135deg, rgba(236,72,153,0.06), rgba(139,92,246,0.06));
      border-radius: 16px;
    }
    .hours-inline h3 {
      font-size: 1.15rem;
      font-weight: 700;
      background: linear-gradient(135deg, #EC4899, #8B5CF6);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin-bottom: 12px;
    }

    /* Blog Grid */
    .blog-grid { display: grid; grid-template-columns: repeat(auto-fill, minmax(290px, 1fr)); gap: 24px; }
    .blog-card {
      background: #fff;
      border-radius: 20px;
      overflow: hidden;
      box-shadow: 0 4px 20px rgba(0,0,0,0.06);
      transition: transform 0.25s, box-shadow 0.25s;
    }
    .blog-card:hover { transform: translateY(-4px); box-shadow: 0 8px 32px rgba(139,92,246,0.12); }
    .blog-card-img { width: 100%; height: 200px; object-fit: cover; }
    .blog-card-img-placeholder {
      width: 100%;
      height: 200px;
      background: linear-gradient(135deg, #EC4899, #8B5CF6);
    }
    .blog-card-body { padding: 22px; }
    .blog-tag {
      display: inline-block;
      background: linear-gradient(135deg, #EC4899, #8B5CF6);
      color: #fff;
      font-size: 0.7rem;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 50px;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      margin-bottom: 10px;
    }
    .blog-card-body h2 { font-size: 1.1rem; font-weight: 700; color: #333; margin-bottom: 6px; }
    .blog-card-body time { font-size: 0.75rem; color: #bbb; display: block; margin-bottom: 10px; }
    .blog-card-text { font-size: 0.9rem; color: #666; line-height: 1.7; }

    /* Footer */
    footer {
      background: #1a1a2e;
      color: rgba(255,255,255,0.5);
      padding: 24px;
      text-align: center;
      font-size: 0.8rem;
    }
    footer a { color: rgba(255,255,255,0.7); text-decoration: none; }
    footer a:hover { color: #EC4899; }

    @media (max-width: 768px) {
      .hamburger { display: block; }
      nav {
        display: none;
        position: absolute;
        top: 64px;
        left: 0;
        right: 0;
        background: #fff;
        flex-direction: column;
        padding: 20px 24px;
        gap: 14px;
        z-index: 100;
        box-shadow: 0 4px 16px rgba(0,0,0,0.06);
      }
      nav.open { display: flex; }
      .hero h1 { font-size: 2.2rem; }
      .hero { padding: 56px 24px; }
      .blog-grid { grid-template-columns: 1fr; }
      .contact-grid { grid-template-columns: 1fr; }
      .page-banner h1 { font-size: 1.75rem; }
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
