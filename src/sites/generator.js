const fs = require('fs');
const path = require('path');
const { marked } = require('marked');
const config = require('../config');
const { queries } = require('../db');
const logger = require('../logger');

marked.setOptions({ breaks: true, gfm: true });

const SITES_DIR = config.paths.sites;
const PREVIEWS_DIR = path.join(SITES_DIR, '_previews');

function processContent(rawContent) {
  const fields = ['hero', 'about', 'contact', 'services', 'hours'];
  const processed = {};
  for (const field of fields) {
    const value = rawContent[field];
    if (value && typeof value === 'string') {
      processed[field] = marked(value);
    } else {
      processed[field] = value || '';
    }
  }
  return processed;
}

function loadTemplate(templateName) {
  // Sanitize template name to prevent path traversal / arbitrary require()
  const safeName = (templateName || 'starter').replace(/[^a-z0-9-]/gi, '');
  const templatePath = path.join(config.paths.templates, safeName);
  try {
    const resolvedPath = require.resolve(templatePath);
    delete require.cache[resolvedPath];
    return require(templatePath);
  } catch (err) {
    logger.warn(`Template "${templateName}" not found, falling back to starter`);
    const fallbackPath = path.join(config.paths.templates, 'starter');
    const resolvedPath = require.resolve(fallbackPath);
    delete require.cache[resolvedPath];
    return require(fallbackPath);
  }
}

function generateSite(tenant) {
  const template = loadTemplate(tenant.template);
  const rawContent = queries.getCurrentContent(tenant.id);
  const content = processContent(rawContent);

  let blogPosts = queries.getBlogPosts(tenant.id, false);
  blogPosts = blogPosts.map(post => ({
    ...post,
    content: post.content ? marked(post.content) : '',
  }));

  const outputDir = path.join(SITES_DIR, tenant.subdomain);
  fs.mkdirSync(outputDir, { recursive: true });

  const pages = ['index', 'about', 'contact', 'services', 'blog'];
  for (const pageName of pages) {
    const html = template.renderPage(pageName, { tenant, content, blogPosts });
    const filePath = path.join(outputDir, `${pageName}.html`);
    fs.writeFileSync(filePath, html, 'utf8');
  }

  const uploadsDir = path.join(config.paths.uploads, tenant.id);
  const imagesOutputDir = path.join(outputDir, 'images');
  try {
    const files = fs.readdirSync(uploadsDir);
    if (files.length > 0) {
      fs.mkdirSync(imagesOutputDir, { recursive: true });
      for (const file of files) {
        const src = path.join(uploadsDir, file);
        const dest = path.join(imagesOutputDir, file);
        if (fs.statSync(src).isFile()) {
          fs.copyFileSync(src, dest);
        }
      }
    }
  } catch (err) { /* no uploads */ }

  logger.info('Site generated', { subdomain: tenant.subdomain, pages: pages.length });
  return { pages, outputDir };
}

function generatePreview(tenant, pendingUpdate) {
  const template = loadTemplate(tenant.template);
  const rawContent = queries.getCurrentContent(tenant.id);

  if (pendingUpdate && pendingUpdate.section) {
    rawContent[pendingUpdate.section] = pendingUpdate.content;
  }

  const content = processContent(rawContent);

  let blogPosts = queries.getBlogPosts(tenant.id, false);
  blogPosts = blogPosts.map(post => ({
    ...post,
    content: post.content ? marked(post.content) : '',
  }));

  if (pendingUpdate && pendingUpdate.update_type === 'blog') {
    blogPosts.unshift({
      id: 'preview',
      title: pendingUpdate.title || '',
      content: pendingUpdate.content ? marked(pendingUpdate.content) : '',
      image_url: JSON.parse(pendingUpdate.image_urls || '[]')[0] || null,
      published_at: new Date().toISOString(),
    });
  }

  if (!pendingUpdate) {
    return null;
  }

  const sectionToPage = {
    hero: 'index', about: 'about', contact: 'contact',
    services: 'services', hours: 'services',
  };
  const pageName = pendingUpdate.update_type === 'blog'
    ? 'blog'
    : (sectionToPage[pendingUpdate.section] || 'index');

  const html = template.renderPage(pageName, { tenant, content, blogPosts });

  fs.mkdirSync(PREVIEWS_DIR, { recursive: true });
  const previewPath = path.join(PREVIEWS_DIR, `${pendingUpdate.confirmation_token}.html`);
  fs.writeFileSync(previewPath, html, 'utf8');

  return {
    token: pendingUpdate.confirmation_token,
    url: `/preview/${pendingUpdate.confirmation_token}`,
  };
}

module.exports = { generateSite, generatePreview };
