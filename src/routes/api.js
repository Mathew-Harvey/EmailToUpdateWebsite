const express = require('express');
const router = express.Router();
const { queries } = require('../db');
const logger = require('../logger');

// ─── Tenant Dashboard API ──────────────────────────────────────────────────────

// Get tenant info (by email, for authenticated dashboard access)
router.get('/tenant/:subdomain', (req, res) => {
  try {
    const tenant = queries.getTenantBySubdomain(req.params.subdomain);
    if (!tenant) return res.status(404).json({ error: 'Site not found' });

    const content = queries.getCurrentContent(tenant.id);
    const blogPosts = queries.getBlogPosts(tenant.id, false);

    res.json({
      tenant: {
        id: tenant.id,
        name: tenant.name,
        email: tenant.email,
        subdomain: tenant.subdomain,
        customDomain: tenant.custom_domain,
        template: tenant.template,
        siteTitle: tenant.site_title,
        siteTagline: tenant.site_tagline,
        subscriptionStatus: tenant.subscription_status,
        verified: !!tenant.verified,
        createdAt: tenant.created_at,
      },
      content,
      blogPosts,
    });
  } catch (err) {
    logger.error('Error fetching tenant', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get content for a specific site (public API for client-side rendering fallback)
router.get('/content/:subdomain', (req, res) => {
  try {
    const tenant = queries.getTenantBySubdomain(req.params.subdomain);
    if (!tenant) return res.status(404).json({ error: 'Site not found' });

    const content = queries.getCurrentContent(tenant.id);
    const blogPosts = queries.getBlogPosts(tenant.id, false);

    res.json({ content, blogPosts, template: tenant.template, siteTitle: tenant.site_title });
  } catch (err) {
    logger.error('Error fetching content', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get content history for a section
router.get('/history/:subdomain/:section', (req, res) => {
  try {
    const tenant = queries.getTenantBySubdomain(req.params.subdomain);
    if (!tenant) return res.status(404).json({ error: 'Site not found' });

    const history = queries.getContentHistory(tenant.id, req.params.section);
    res.json({ history });
  } catch (err) {
    logger.error('Error fetching history', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Rollback content to a specific version
router.post('/rollback/:subdomain/:section/:version', (req, res) => {
  try {
    const tenant = queries.getTenantBySubdomain(req.params.subdomain);
    if (!tenant) return res.status(404).json({ error: 'Site not found' });

    const version = parseInt(req.params.version, 10);
    const result = queries.rollbackContent(tenant.id, req.params.section, version);
    if (!result) return res.status(404).json({ error: 'Version not found' });

    // Regenerate the static site
    try {
      const { generateSite } = require('../sites/generator');
      generateSite(tenant);
    } catch (genErr) {
      logger.error('Error regenerating site after rollback', { error: genErr.message });
    }

    res.json({ success: true, content: result });
  } catch (err) {
    logger.error('Error rolling back', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// List available templates
router.get('/templates', (req, res) => {
  try {
    const fs = require('fs');
    const path = require('path');
    const config = require('../config');
    const templatesDir = config.paths.templates;
    const templates = [];

    if (fs.existsSync(templatesDir)) {
      const dirs = fs.readdirSync(templatesDir, { withFileTypes: true });
      for (const dir of dirs) {
        if (dir.isDirectory()) {
          try {
            const tmpl = require(path.join(templatesDir, dir.name));
            templates.push({
              id: dir.name,
              name: tmpl.name,
              description: tmpl.description,
              thumbnail: tmpl.thumbnail,
            });
          } catch (e) {
            // skip invalid templates
          }
        }
      }
    }

    res.json({ templates });
  } catch (err) {
    logger.error('Error listing templates', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Health check
router.get('/health', (req, res) => {
  const tenantCount = queries.countTenants();
  res.json({ status: 'ok', tenants: tenantCount, uptime: process.uptime() });
});

module.exports = router;
