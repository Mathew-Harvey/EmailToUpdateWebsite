const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const config = require('../config');
const { queries } = require('../db');
const logger = require('../logger');

// Serve landing page
router.get('/', (req, res) => {
  const landingPath = path.join(config.paths.landing, 'index.html');
  if (fs.existsSync(landingPath)) {
    res.sendFile(landingPath);
  } else {
    res.send('<h1>EmailSite</h1><p>Landing page not found. Run the setup.</p>');
  }
});

// Serve signup page
router.get('/signup', (req, res) => {
  const signupPath = path.join(config.paths.landing, 'signup.html');
  if (fs.existsSync(signupPath)) {
    res.sendFile(signupPath);
  } else {
    res.redirect('/');
  }
});

// API: Sign up
router.post('/api/signup', async (req, res) => {
  try {
    const { email, name, subdomain, template, siteTitle } = req.body;

    if (!email || !subdomain) {
      return res.status(400).json({ error: 'Email and subdomain are required' });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.status(400).json({ error: 'Invalid email address' });
    }

    // Validate subdomain
    const subdomainClean = subdomain.toLowerCase().replace(/[^a-z0-9-]/g, '');
    if (subdomainClean.length < 3 || subdomainClean.length > 30) {
      return res.status(400).json({ error: 'Subdomain must be 3-30 alphanumeric characters' });
    }

    // Check uniqueness
    if (queries.getTenantByEmail(email.toLowerCase())) {
      return res.status(409).json({ error: 'An account with this email already exists' });
    }
    if (queries.getTenantBySubdomain(subdomainClean)) {
      return res.status(409).json({ error: 'This subdomain is already taken' });
    }

    // Create tenant
    const tenant = queries.createTenant({
      email: email.toLowerCase().trim(),
      name: name || '',
      subdomain: subdomainClean,
      template: template || 'starter',
      siteTitle: siteTitle || 'My Website',
    });

    // Send verification email
    try {
      const sender = require('../email/sender');
      await sender.sendVerificationEmail(tenant);
    } catch (emailErr) {
      logger.warn('Failed to send verification email', { error: emailErr.message });
      // Don't fail signup if email fails
    }

    // Generate initial site
    try {
      const { generateSite } = require('../sites/generator');
      generateSite(tenant);
    } catch (genErr) {
      logger.warn('Failed to generate initial site', { error: genErr.message });
    }

    res.json({
      success: true,
      tenant: {
        id: tenant.id,
        email: tenant.email,
        subdomain: tenant.subdomain,
        siteUrl: `${config.appUrl}/site/${tenant.subdomain}`,
      },
    });
  } catch (err) {
    logger.error('Signup error', { error: err.message });
    res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
});

// Verify email
router.get('/verify/:token', (req, res) => {
  try {
    const tenant = queries.verifyTenant(req.params.token);
    if (!tenant) {
      return res.status(404).send(simplePage('Verification Failed', 'This verification link is invalid or has expired.'));
    }

    res.send(simplePage(
      'Email Verified!',
      `<p>Your email has been verified. Your website is live at:</p>
       <p><a href="/site/${tenant.subdomain}" style="color:#2563EB; font-weight:600; font-size:1.2rem;">${config.appUrl}/site/${tenant.subdomain}</a></p>
       <p style="margin-top:1.5rem;">Start updating your site by sending an email to <strong>${config.imap.user || 'our email address'}</strong> with one of these subject lines:</p>
       <ul style="text-align:left; max-width:400px; margin:1rem auto; line-height:2;">
         <li><code>Update About</code> — Update your About section</li>
         <li><code>Update Contact</code> — Update contact info</li>
         <li><code>New Blog Post</code> — Add a blog post</li>
         <li><code>Update Hero</code> — Update your homepage</li>
       </ul>`,
      true
    ));
  } catch (err) {
    logger.error('Verification error', { error: err.message });
    res.status(500).send(simplePage('Error', 'Something went wrong.'));
  }
});

// Payment success
router.get('/payment/success', (req, res) => {
  res.send(simplePage(
    'Payment Successful!',
    '<p>Your subscription is active. You can now update your website by sending an email.</p><p><a href="/" style="color:#2563EB;">Back to home</a></p>',
    true
  ));
});

// Payment cancel
router.get('/payment/cancel', (req, res) => {
  res.send(simplePage(
    'Payment Cancelled',
    '<p>No worries! You can try again whenever you\'re ready.</p><p><a href="/signup" style="color:#2563EB;">Back to signup</a></p>'
  ));
});

// Create checkout session
router.post('/api/create-checkout', async (req, res) => {
  try {
    const { tenantId } = req.body;
    const tenant = queries.getTenantById(tenantId);
    if (!tenant) return res.status(404).json({ error: 'Tenant not found' });

    const stripeModule = require('../payments/stripe');
    const { url } = await stripeModule.createCheckoutSession(tenant);
    res.json({ url });
  } catch (err) {
    logger.error('Checkout error', { error: err.message });
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

// List templates
router.get('/api/templates', (req, res) => {
  try {
    const templatesDir = config.paths.templates;
    const templates = [];
    if (fs.existsSync(templatesDir)) {
      const dirs = fs.readdirSync(templatesDir, { withFileTypes: true });
      for (const dir of dirs) {
        if (dir.isDirectory()) {
          try {
            const tmpl = require(path.join(templatesDir, dir.name));
            templates.push({ id: dir.name, name: tmpl.name, description: tmpl.description });
          } catch (e) { /* skip */ }
        }
      }
    }
    res.json({ templates });
  } catch (err) {
    res.status(500).json({ error: 'Failed to list templates' });
  }
});

function simplePage(title, bodyHtml, success) {
  return `<!DOCTYPE html>
<html><head>
<title>${title} - EmailSite</title>
<meta name="viewport" content="width=device-width, initial-scale=1">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family:'Inter',sans-serif; min-height:100vh; display:flex; justify-content:center; align-items:center; background:#F8FAFC; padding:2rem; }
  .card { background:white; border-radius:16px; padding:3rem; max-width:600px; width:100%; box-shadow:0 4px 24px rgba(0,0,0,0.08); text-align:center; }
  h1 { font-size:1.8rem; margin-bottom:1rem; color:${success ? '#059669' : '#0F172A'}; }
  p { color:#475569; line-height:1.7; margin-bottom:0.75rem; }
  a { color:#2563EB; text-decoration:none; }
  code { background:#F1F5F9; padding:2px 8px; border-radius:4px; font-size:0.9rem; }
  ul { list-style:none; }
  li { padding:4px 0; }
  li code { display:inline-block; min-width:180px; text-align:left; }
</style>
</head><body><div class="card"><h1>${title}</h1>${bodyHtml}</div></body></html>`;
}

module.exports = router;
