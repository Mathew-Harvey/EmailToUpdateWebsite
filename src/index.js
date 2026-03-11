const express = require('express');
const path = require('path');
const fs = require('fs');
const config = require('./config');
const logger = require('./logger');

// Ensure directories exist
[config.paths.data, config.paths.sites, config.paths.uploads, path.join(config.paths.sites, '_previews')].forEach(dir => {
  fs.mkdirSync(dir, { recursive: true });
});

// Initialize database (runs schema creation on require)
require('./db');

const app = express();

// ─── Stripe webhook needs raw body (must be before json parser) ────────────────
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  try {
    const stripe = require('./payments/stripe');
    const result = stripe.handleWebhook(req.body, req.headers['stripe-signature']);
    res.json(result);
  } catch (err) {
    logger.error('Stripe webhook error', { error: err.message });
    res.status(400).json({ error: err.message });
  }
});

// ─── Body parsers ──────────────────────────────────────────────────────────────
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ─── Static files ──────────────────────────────────────────────────────────────
app.use('/uploads', express.static(config.paths.uploads));
app.use('/landing', express.static(config.paths.landing));

// ─── Routes ────────────────────────────────────────────────────────────────────

// Landing page routes
const landingRoutes = require('./routes/landing');
app.use('/', landingRoutes);

// API routes
const apiRoutes = require('./routes/api');
app.use('/api', apiRoutes);

// Tenant site routes
const siteRoutes = require('./routes/sites');
app.use('/', siteRoutes);

// ─── 404 handler ───────────────────────────────────────────────────────────────
app.use((req, res) => {
  res.status(404).send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Page Not Found - EmailSite</title>
      <meta name="viewport" content="width=device-width, initial-scale=1">
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600&display=swap" rel="stylesheet">
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: 'Inter', sans-serif; display: flex; justify-content: center; align-items: center; min-height: 100vh; background: #F8FAFC; color: #0F172A; }
        .container { text-align: center; padding: 2rem; }
        h1 { font-size: 6rem; font-weight: 600; color: #2563EB; }
        p { font-size: 1.25rem; color: #64748B; margin: 1rem 0; }
        a { color: #2563EB; text-decoration: none; font-weight: 600; }
        a:hover { text-decoration: underline; }
      </style>
    </head>
    <body>
      <div class="container">
        <h1>404</h1>
        <p>This page doesn't exist.</p>
        <a href="/">← Back to EmailSite</a>
      </div>
    </body>
    </html>
  `);
});

// ─── Error handler ─────────────────────────────────────────────────────────────
app.use((err, req, res, _next) => {
  logger.error('Unhandled error', { error: err.message, stack: err.stack });
  res.status(500).json({ error: 'Internal server error' });
});

// ─── Start server ──────────────────────────────────────────────────────────────
app.listen(config.port, () => {
  logger.info(`EmailSite server running on port ${config.port}`);
  logger.info(`Landing page: ${config.appUrl}`);
  logger.info(`Environment: ${config.nodeEnv}`);

  // Start email poller if IMAP credentials are configured
  if (config.imap.user && config.imap.password) {
    try {
      const poller = require('./email/poller');
      poller.start();
      logger.info('Email poller started');
    } catch (err) {
      logger.warn('Email poller failed to start', { error: err.message });
    }
  } else {
    logger.warn('IMAP credentials not configured — email polling disabled');
  }

  // Expire pending updates periodically
  setInterval(() => {
    try {
      const { queries } = require('./db');
      queries.expirePendingUpdates();
    } catch (err) {
      // ignore
    }
  }, 60000);
});

module.exports = app;
