module.exports = {
  name: 'Trades',
  description: 'Bold, dark design with orange accents and prominent CTAs for contractors, plumbers, and electricians',
  thumbnail: '#F97316',

  renderPage(pageName, { tenant, content, blogPosts }) {
    const subdomain = tenant.subdomain;
    const siteTitle = tenant.site_title || 'Our Services';
    const tagline = tenant.site_tagline || '';

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

    // Extract phone number from contact content if available
    const phoneMatch = content.contact ? content.contact.match(/[\(]?\d{3}[\)]?[-.\s]?\d{3}[-.\s]?\d{4}/) : null;
    const phoneNumber = phoneMatch ? phoneMatch[0] : null;

    function getPageContent() {
      switch (pageName) {
        case 'index':
          return `
        <section class="hero">
          <div class="container">
            <div class="hero-content">
              <h1>${siteTitle}</h1>
              ${tagline ? `<p class="tagline">${tagline}</p>` : ''}
              <div class="hero-ctas">
                ${phoneNumber ? `<a href="tel:${phoneNumber.replace(/[^\d]/g, '')}" class="btn btn-orange btn-large">&#9742; Call Now: ${phoneNumber}</a>` : ''}
                <a href="/site/${subdomain}/contact" class="btn btn-orange ${phoneNumber ? '' : 'btn-large'}">Get a Free Quote</a>
              </div>
            </div>
          </div>
        </section>
        ${phoneNumber ? `
        <div class="phone-strip">
          <div class="container">
            <span class="phone-strip-text">Need help now?</span>
            <a href="tel:${phoneNumber.replace(/[^\d]/g, '')}" class="phone-strip-link">&#9742; ${phoneNumber}</a>
          </div>
        </div>` : ''}
        <section class="section bg-light">
          <div class="container">
            <div class="intro-text">
              ${content.hero || '<p class="placeholder">Send an email to update this section.</p>'}
            </div>
          </div>
        </section>
        ${content.hours ? `
        <section class="section bg-dark">
          <div class="container">
            <h2 class="section-heading orange">Business Hours</h2>
            <div class="hours-box">
              ${content.hours}
            </div>
          </div>
        </section>` : ''}
        <section class="section bg-light">
          <div class="container cta-section">
            <h2 class="section-heading">Ready to Get Started?</h2>
            <p class="cta-sub">We are available for emergency calls 24/7</p>
            <div class="cta-buttons">
              ${phoneNumber ? `<a href="tel:${phoneNumber.replace(/[^\d]/g, '')}" class="btn btn-orange btn-large">&#9742; Call ${phoneNumber}</a>` : ''}
              <a href="/site/${subdomain}/contact" class="btn btn-dark">Request a Quote</a>
            </div>
          </div>
        </section>`;

        case 'about':
          return `
        <section class="page-banner">
          <div class="container">
            <h1>About Us</h1>
            <p class="page-sub">Trusted professionals you can count on</p>
          </div>
        </section>
        <section class="section bg-light">
          <div class="container">
            <div class="body-content">
              ${content.about || '<p class="placeholder">Send an email to update this section.</p>'}
            </div>
          </div>
        </section>`;

        case 'contact':
          return `
        <section class="page-banner">
          <div class="container">
            <h1>Contact Us</h1>
            <p class="page-sub">Get in touch for a free estimate</p>
          </div>
        </section>
        ${phoneNumber ? `
        <div class="phone-strip">
          <div class="container">
            <span class="phone-strip-text">Call us directly:</span>
            <a href="tel:${phoneNumber.replace(/[^\d]/g, '')}" class="phone-strip-link">&#9742; ${phoneNumber}</a>
          </div>
        </div>` : ''}
        <section class="section bg-light">
          <div class="container">
            <div class="contact-grid">
              <div class="contact-block">
                <h2>Get in Touch</h2>
                <div class="body-content">
                  ${content.contact || '<p class="placeholder">Send an email to update this section.</p>'}
                </div>
              </div>
              ${content.hours ? `
              <div class="hours-sidebar">
                <h3>Business Hours</h3>
                <div class="hours-list">${content.hours}</div>
              </div>` : ''}
            </div>
          </div>
        </section>`;

        case 'services':
          return `
        <section class="page-banner">
          <div class="container">
            <h1>Our Services</h1>
            <p class="page-sub">Professional solutions for every job</p>
          </div>
        </section>
        <section class="section bg-light">
          <div class="container">
            <div class="body-content services-list">
              ${content.services || '<p class="placeholder">Send an email to update this section.</p>'}
            </div>
            ${content.hours ? `
            <div class="hours-sidebar standalone">
              <h3>Business Hours</h3>
              <div class="hours-list">${content.hours}</div>
            </div>` : ''}
            <div class="cta-box">
              <h3>Need a Hand?</h3>
              <p>Contact us today for a free, no-obligation estimate.</p>
              <div class="cta-buttons">
                ${phoneNumber ? `<a href="tel:${phoneNumber.replace(/[^\d]/g, '')}" class="btn btn-orange">&#9742; Call Now</a>` : ''}
                <a href="/site/${subdomain}/contact" class="btn btn-dark">Request Quote</a>
              </div>
            </div>
          </div>
        </section>`;

        case 'blog':
          return `
        <section class="page-banner">
          <div class="container">
            <h1>Blog</h1>
            <p class="page-sub">Tips, news, and project updates</p>
          </div>
        </section>
        <section class="section bg-light">
          <div class="container">
            ${blogPosts.length === 0
              ? '<p class="placeholder">No posts yet. Send an email with subject "Blog: Your Title" to share updates.</p>'
              : blogPosts.map(post => `
              <article class="blog-post">
                <div class="blog-post-inner">
                  ${post.image_url ? `<img src="${post.image_url}" alt="${post.title}" class="blog-img">` : ''}
                  <div class="blog-text">
                    <time>${post.published_at ? new Date(post.published_at).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' }) : ''}</time>
                    <h2>${post.title}</h2>
                    <div class="blog-body">${post.content}</div>
                  </div>
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
  <title>${pageName === 'index' ? siteTitle : pageName.charAt(0).toUpperCase() + pageName.slice(1) + ' - ' + siteTitle}</title>
  <link href="https://fonts.googleapis.com/css2?family=Oswald:wght@400;500;600;700&family=Roboto:wght@300;400;500;700&display=swap" rel="stylesheet">
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: 'Roboto', sans-serif;
      background: #FAFAF9;
      color: #292524;
      min-height: 100vh;
      display: flex;
      flex-direction: column;
    }
    img { max-width: 100%; height: auto; }
    .container { max-width: 960px; margin: 0 auto; padding: 0 24px; }

    /* Header */
    header {
      background: #1C1917;
      padding: 0 24px;
      border-bottom: 3px solid #F97316;
    }
    .header-inner {
      max-width: 960px;
      margin: 0 auto;
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 68px;
    }
    .logo {
      font-family: 'Oswald', sans-serif;
      font-size: 1.3rem;
      font-weight: 700;
      color: #fff;
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    nav { display: flex; gap: 24px; align-items: center; }
    nav a {
      font-family: 'Oswald', sans-serif;
      color: rgba(255,255,255,0.7);
      text-decoration: none;
      font-size: 0.88rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.06em;
      transition: color 0.2s;
    }
    nav a:hover, nav a.active { color: #F97316; }
    .hamburger { display: none; background: none; border: none; font-size: 1.5rem; cursor: pointer; color: #F97316; }
    .header-phone {
      display: flex;
      align-items: center;
      gap: 6px;
      color: #F97316;
      font-family: 'Oswald', sans-serif;
      font-weight: 600;
      font-size: 0.95rem;
      text-decoration: none;
    }

    /* Hero */
    .hero {
      background: linear-gradient(165deg, #1C1917 0%, #292524 50%, #1C1917 100%);
      color: #fff;
      padding: 80px 24px;
      text-align: center;
    }
    .hero-content { max-width: 700px; margin: 0 auto; }
    .hero h1 {
      font-family: 'Oswald', sans-serif;
      font-size: 3.5rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      margin-bottom: 16px;
      line-height: 1.1;
    }
    .hero .tagline {
      font-size: 1.15rem;
      color: rgba(255,255,255,0.7);
      line-height: 1.7;
      margin-bottom: 32px;
      font-weight: 300;
    }
    .hero-ctas { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }

    /* Phone Strip */
    .phone-strip {
      background: #F97316;
      padding: 12px 24px;
    }
    .phone-strip .container {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 12px;
    }
    .phone-strip-text {
      font-family: 'Oswald', sans-serif;
      color: #fff;
      font-size: 0.9rem;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .phone-strip-link {
      color: #fff;
      font-family: 'Oswald', sans-serif;
      font-size: 1.15rem;
      font-weight: 700;
      text-decoration: none;
      letter-spacing: 0.02em;
    }
    .phone-strip-link:hover { text-decoration: underline; }

    /* Buttons */
    .btn {
      display: inline-block;
      padding: 14px 28px;
      font-family: 'Oswald', sans-serif;
      font-size: 0.9rem;
      font-weight: 600;
      text-decoration: none;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      transition: all 0.2s;
      border-radius: 4px;
    }
    .btn-large { padding: 16px 36px; font-size: 1rem; }
    .btn-orange { background: #F97316; color: #fff; }
    .btn-orange:hover { background: #EA580C; }
    .btn-dark { background: #1C1917; color: #fff; }
    .btn-dark:hover { background: #292524; }

    /* Page Banner */
    .page-banner {
      background: linear-gradient(165deg, #1C1917 0%, #292524 100%);
      color: #fff;
      padding: 56px 24px;
      text-align: center;
    }
    .page-banner h1 {
      font-family: 'Oswald', sans-serif;
      font-size: 2.5rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      margin-bottom: 8px;
    }
    .page-sub { font-size: 1rem; color: rgba(255,255,255,0.6); font-weight: 300; }

    /* Sections */
    .section { padding: 56px 0; }
    .bg-light { background: #FAFAF9; flex: 1; }
    .bg-dark { background: #1C1917; color: #fff; }
    .section-heading {
      font-family: 'Oswald', sans-serif;
      font-size: 1.8rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      text-align: center;
      margin-bottom: 24px;
      color: #1C1917;
    }
    .section-heading.orange { color: #F97316; }
    .intro-text {
      font-size: 1.05rem;
      line-height: 1.9;
      color: #57534E;
      max-width: 720px;
      margin: 0 auto;
    }
    .body-content { font-size: 1.02rem; line-height: 1.9; color: #57534E; }
    .placeholder { color: #A8A29E; text-align: center; padding: 32px 0; font-style: italic; }

    /* Services List */
    .services-list h1, .services-list h2, .services-list h3 {
      font-family: 'Oswald', sans-serif;
      color: #1C1917;
      text-transform: uppercase;
      margin-top: 32px;
      margin-bottom: 8px;
      padding-bottom: 8px;
      border-bottom: 2px solid #F97316;
    }

    /* Hours */
    .hours-box {
      max-width: 440px;
      margin: 0 auto;
      text-align: center;
      line-height: 2;
      font-size: 1.02rem;
      color: rgba(255,255,255,0.8);
    }
    .hours-sidebar {
      background: #1C1917;
      border-radius: 8px;
      padding: 28px;
      color: #FAFAF9;
    }
    .hours-sidebar.standalone { margin-top: 40px; }
    .hours-sidebar h3 {
      font-family: 'Oswald', sans-serif;
      font-size: 1.15rem;
      text-transform: uppercase;
      color: #F97316;
      margin-bottom: 12px;
    }
    .hours-list { line-height: 1.9; font-size: 0.95rem; }

    /* Contact Grid */
    .contact-grid { display: grid; grid-template-columns: 1fr 320px; gap: 36px; }
    .contact-block h2 {
      font-family: 'Oswald', sans-serif;
      font-size: 1.5rem;
      text-transform: uppercase;
      color: #1C1917;
      margin-bottom: 16px;
    }

    /* CTA Section */
    .cta-section { text-align: center; }
    .cta-sub { color: #78716C; margin-bottom: 24px; font-size: 1.05rem; }
    .cta-buttons { display: flex; gap: 14px; justify-content: center; flex-wrap: wrap; }
    .cta-box {
      margin-top: 48px;
      background: #292524;
      border-radius: 8px;
      padding: 40px;
      text-align: center;
      color: #FAFAF9;
    }
    .cta-box h3 {
      font-family: 'Oswald', sans-serif;
      font-size: 1.5rem;
      text-transform: uppercase;
      color: #F97316;
      margin-bottom: 8px;
    }
    .cta-box p { color: rgba(250,250,249,0.7); margin-bottom: 20px; }

    /* Blog */
    .blog-post {
      margin-bottom: 36px;
      background: #fff;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #E7E5E4;
    }
    .blog-post-inner { display: flex; align-items: stretch; }
    .blog-img { width: 280px; height: auto; object-fit: cover; flex-shrink: 0; }
    .blog-text { padding: 28px; flex: 1; }
    .blog-text time {
      font-size: 0.78rem;
      color: #A8A29E;
      display: block;
      margin-bottom: 6px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .blog-text h2 {
      font-family: 'Oswald', sans-serif;
      font-size: 1.3rem;
      font-weight: 600;
      color: #1C1917;
      margin-bottom: 12px;
      text-transform: uppercase;
    }
    .blog-body { line-height: 1.8; color: #57534E; font-size: 0.95rem; }

    /* Footer */
    footer {
      background: #1C1917;
      color: rgba(250,250,249,0.4);
      padding: 24px;
      text-align: center;
      font-size: 0.8rem;
      border-top: 3px solid #F97316;
    }
    footer a { color: rgba(250,250,249,0.6); text-decoration: none; }
    footer a:hover { color: #F97316; }

    @media (max-width: 768px) {
      .hamburger { display: block; }
      nav {
        display: none;
        position: absolute;
        top: 68px;
        left: 0;
        right: 0;
        background: #1C1917;
        flex-direction: column;
        padding: 20px 24px;
        gap: 14px;
        z-index: 100;
        border-bottom: 3px solid #F97316;
      }
      nav.open { display: flex; }
      .hero h1 { font-size: 2.4rem; }
      .hero { padding: 56px 24px; }
      .page-banner h1 { font-size: 1.8rem; }
      .contact-grid { grid-template-columns: 1fr; }
      .blog-post-inner { flex-direction: column; }
      .blog-img { width: 100%; height: 200px; }
      .header-phone { display: none; }
    }
  </style>
</head>
<body>
  <header>
    <div class="header-inner" style="position: relative;">
      <a href="/site/${subdomain}/" class="logo">${siteTitle}</a>
      ${phoneNumber ? `<a href="tel:${phoneNumber.replace(/[^\d]/g, '')}" class="header-phone">&#9742; ${phoneNumber}</a>` : ''}
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
