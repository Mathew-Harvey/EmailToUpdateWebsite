const express = require('express');
const router = express.Router();
const path = require('path');
const fs = require('fs');
const config = require('../config');
const { queries } = require('../db');
const logger = require('../logger');

// ─── Preview pages ─────────────────────────────────────────────────────────────
router.get('/preview/:token', (req, res) => {
  const safeToken = req.params.token.replace(/[^a-zA-Z0-9]/g, '');
  const previewPath = path.join(config.paths.sites, '_previews', `${safeToken}.html`);
  if (fs.existsSync(previewPath)) {
    res.sendFile(previewPath);
  } else {
    res.status(404).send(notFoundPage('Preview not found or expired'));
  }
});

// ─── Confirm/reject via link ───────────────────────────────────────────────────
router.get('/confirm/:token', (req, res) => {
  try {
    const pending = queries.getPendingByToken(req.params.token);
    if (!pending) {
      return res.status(404).send(notFoundPage('This confirmation link has expired or already been used.'));
    }

    const tenant = queries.getTenantById(pending.tenant_id);

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Confirm Update - EmailSite</title>
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
        <style>
          * { margin: 0; padding: 0; box-sizing: border-box; }
          body { font-family: 'Inter', sans-serif; background: #F8FAFC; min-height: 100vh; display: flex; justify-content: center; align-items: center; }
          .card { background: white; border-radius: 16px; padding: 2.5rem; max-width: 500px; width: 90%; box-shadow: 0 4px 24px rgba(0,0,0,0.08); text-align: center; }
          h1 { font-size: 1.5rem; margin-bottom: 0.5rem; color: #0F172A; }
          .meta { color: #64748B; margin-bottom: 1.5rem; }
          .preview-link { display: block; margin-bottom: 1.5rem; color: #2563EB; }
          .actions { display: flex; gap: 1rem; justify-content: center; }
          .btn { padding: 0.75rem 2rem; border-radius: 8px; border: none; font-size: 1rem; font-weight: 600; cursor: pointer; text-decoration: none; display: inline-block; }
          .btn-publish { background: #22C55E; color: white; }
          .btn-publish:hover { background: #16A34A; }
          .btn-cancel { background: #F1F5F9; color: #64748B; }
          .btn-cancel:hover { background: #E2E8F0; }
          .result { margin-top: 1rem; padding: 1rem; border-radius: 8px; }
          .success { background: #F0FDF4; color: #166534; }
          .error { background: #FEF2F2; color: #991B1B; }
        </style>
      </head>
      <body>
        <div class="card">
          <h1>Publish Update?</h1>
          <p class="meta">
            ${pending.update_type === 'blog' ? 'New blog post' : `Update to "${pending.section}" section`}
            for ${tenant ? tenant.site_title : 'your site'}
          </p>
          <a class="preview-link" href="/preview/${pending.confirmation_token}" target="_blank">
            Preview the change →
          </a>
          <div class="actions">
            <button class="btn btn-publish" onclick="handleAction('publish')">Publish Now</button>
            <button class="btn btn-cancel" onclick="handleAction('reject')">Cancel</button>
          </div>
          <div id="result"></div>
        </div>
        <script>
          async function handleAction(action) {
            const res = await fetch('/api/confirm/' + '${pending.confirmation_token}' + '/' + action, { method: 'POST' });
            const data = await res.json();
            const el = document.getElementById('result');
            if (data.success) {
              el.className = 'result success';
              el.textContent = action === 'publish' ? 'Published! Your site has been updated.' : 'Update cancelled.';
              document.querySelector('.actions').style.display = 'none';
            } else {
              el.className = 'result error';
              el.textContent = data.error || 'Something went wrong.';
            }
          }
        </script>
      </body>
      </html>
    `);
  } catch (err) {
    logger.error('Error showing confirmation', { error: err.message });
    res.status(500).send(notFoundPage('Something went wrong'));
  }
});

// ─── Confirm/reject API ────────────────────────────────────────────────────────
router.post('/api/confirm/:token/:action', (req, res) => {
  try {
    const { token, action } = req.params;

    if (action === 'publish') {
      const pending = queries.confirmPending(token);
      if (!pending) return res.status(404).json({ error: 'Update not found or expired' });

      const tenant = queries.getTenantById(pending.tenant_id);

      // Apply the update
      if (pending.update_type === 'blog') {
        queries.createBlogPost(tenant.id, {
          title: pending.title || '',
          content: pending.content,
          imageUrl: JSON.parse(pending.image_urls || '[]')[0] || null,
          publish: true,
        });
      } else {
        queries.updateContent(tenant.id, pending.section, pending.content);
      }

      // Regenerate static site
      try {
        const { generateSite } = require('../sites/generator');
        generateSite(tenant);
      } catch (genErr) {
        logger.error('Error regenerating site', { error: genErr.message });
      }

      return res.json({ success: true });
    }

    if (action === 'reject') {
      const pending = queries.rejectPending(token);
      if (!pending) return res.status(404).json({ error: 'Update not found or expired' });
      return res.json({ success: true });
    }

    res.status(400).json({ error: 'Invalid action' });
  } catch (err) {
    logger.error('Error confirming update', { error: err.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

// ─── Serve tenant sites ────────────────────────────────────────────────────────
router.get('/site/:subdomain', (req, res) => {
  serveSitePage(req.params.subdomain, 'index', res);
});

router.get('/site/:subdomain/', (req, res) => {
  serveSitePage(req.params.subdomain, 'index', res);
});

router.get('/site/:subdomain/:page', (req, res) => {
  serveSitePage(req.params.subdomain, req.params.page, res);
});

function serveSitePage(subdomain, page, res) {
  // Sanitize inputs to prevent path traversal
  const safeSubdomain = subdomain.replace(/[^a-zA-Z0-9-]/g, '');
  const safePage = page.replace(/[^a-zA-Z0-9-]/g, '');
  if (!safeSubdomain || !safePage) {
    return res.status(400).send(notFoundPage('Invalid request'));
  }
  const sitePath = path.join(config.paths.sites, safeSubdomain, `${safePage}.html`);

  if (fs.existsSync(sitePath)) {
    res.sendFile(sitePath);
  } else {
    // Try to generate the site on-the-fly
    try {
      const tenant = queries.getTenantBySubdomain(subdomain);
      if (tenant) {
        const { generateSite } = require('../sites/generator');
        generateSite(tenant);
        if (fs.existsSync(sitePath)) {
          return res.sendFile(sitePath);
        }
      }
    } catch (err) {
      logger.error('Error generating site on-the-fly', { error: err.message });
    }
    res.status(404).send(notFoundPage('Site not found'));
  }
}

function escapeHtml(str) {
  return String(str).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
}

function notFoundPage(message) {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Not Found - EmailSite</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #F8FAFC; }
        .container { text-align: center; padding: 2rem; }
        h1 { color: #2563EB; font-size: 2rem; margin-bottom: 0.5rem; }
        p { color: #64748B; font-size: 1.1rem; }
        a { color: #2563EB; text-decoration: none; font-weight: 600; display: block; margin-top: 1rem; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>Not Found</h1>
        <p>${escapeHtml(message)}</p>
        <a href="/">← Back to EmailSite</a>
      </div>
    </body>
    </html>
  `;
}

module.exports = router;
