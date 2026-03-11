require('dotenv').config();

module.exports = {
  port: parseInt(process.env.PORT || '3000', 10),
  appUrl: process.env.APP_URL || 'http://localhost:3000',
  appDomain: process.env.APP_DOMAIN || 'localhost',
  nodeEnv: process.env.NODE_ENV || 'development',

  imap: {
    user: process.env.GMAIL_USER,
    password: process.env.GMAIL_APP_PASSWORD,
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
    tlsOptions: { rejectUnauthorized: false },
  },

  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    auth: {
      user: process.env.SMTP_USER || process.env.GMAIL_USER,
      pass: process.env.SMTP_PASS || process.env.GMAIL_APP_PASSWORD,
    },
  },

  openai: {
    apiKey: process.env.OPENAI_API_KEY,
  },

  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY,
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    priceId: process.env.STRIPE_PRICE_ID,
  },

  paths: {
    data: require('path').join(__dirname, '..', 'data'),
    sites: require('path').join(__dirname, '..', 'sites'),
    uploads: require('path').join(__dirname, '..', 'uploads'),
    templates: require('path').join(__dirname, '..', 'templates'),
    landing: require('path').join(__dirname, '..', 'landing'),
  },
};
