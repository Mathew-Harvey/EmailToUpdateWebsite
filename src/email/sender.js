const nodemailer = require('nodemailer');
const config = require('../config');
const logger = require('../logger');

const FROM_ADDRESS = `EmailSite <${config.smtp.auth.user || 'noreply@emailsite.co'}>`;

/**
 * Lazy-initialized SMTP transporter. Only created when first email is sent.
 */
let _transporter = null;
function getTransporter() {
  if (!_transporter) {
    if (process.env.NODE_ENV === 'test') {
      _transporter = nodemailer.createTransport({ jsonTransport: true });
    } else {
      _transporter = nodemailer.createTransport({
        host: config.smtp.host,
        port: config.smtp.port,
        secure: config.smtp.port === 465,
        auth: config.smtp.auth,
        connectionTimeout: 5000,
        greetingTimeout: 5000,
        socketTimeout: 5000,
      });
    }
  }
  return _transporter;
}

/**
 * Wrap body content in a styled HTML email template.
 */
function wrapHtml(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0; padding:0; background-color:#f4f4f7; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;">
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#f4f4f7;">
    <tr>
      <td align="center" style="padding: 40px 20px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" style="background-color:#ffffff; border-radius:8px; overflow:hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background-color:#4F46E5; padding: 24px 32px;">
              <h1 style="margin:0; color:#ffffff; font-size:22px; font-weight:600;">EmailSite</h1>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding: 32px;">
              ${bodyHtml}
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding: 20px 32px; background-color:#f9fafb; border-top: 1px solid #e5e7eb;">
              <p style="margin:0; font-size:13px; color:#6b7280; text-align:center;">
                EmailSite &mdash; Update your website by email.<br>
                <a href="${config.appUrl}" style="color:#4F46E5; text-decoration:none;">${config.appUrl}</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

/**
 * Send a verification email to a newly registered tenant.
 *
 * @param {Object} tenant - Tenant record with email and verification_token
 */
async function sendVerificationEmail(tenant) {
  const verifyUrl = `${config.appUrl}/verify/${tenant.verification_token}`;

  const bodyHtml = `
    <h2 style="margin:0 0 16px; color:#111827; font-size:20px;">Verify your email</h2>
    <p style="margin:0 0 16px; color:#374151; font-size:15px; line-height:1.6;">
      Welcome to EmailSite! Please verify your email address to start updating your website by email.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td style="background-color:#4F46E5; border-radius:6px;">
          <a href="${verifyUrl}" style="display:inline-block; padding: 12px 32px; color:#ffffff; text-decoration:none; font-size:15px; font-weight:600;">
            Verify Email Address
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0; color:#6b7280; font-size:13px;">
      Or copy and paste this link: <a href="${verifyUrl}" style="color:#4F46E5;">${verifyUrl}</a>
    </p>`;

  try {
    await getTransporter().sendMail({
      from: FROM_ADDRESS,
      to: tenant.email,
      subject: 'Verify your EmailSite account',
      html: wrapHtml('Verify your EmailSite account', bodyHtml),
    });
    logger.info('Verification email sent', { email: tenant.email });
  } catch (err) {
    logger.error('Failed to send verification email', { email: tenant.email, error: err.message });
    throw err;
  }
}

/**
 * Send a confirmation request with a preview link. User replies YES to publish.
 *
 * @param {Object} tenant - Tenant record
 * @param {Object} pendingUpdate - Pending update record
 * @param {string} previewUrl - URL to preview the update
 */
async function sendConfirmationRequest(tenant, pendingUpdate, previewUrl) {
  const sectionLabel = pendingUpdate.section || pendingUpdate.update_type;
  const contentPreview = (pendingUpdate.content || '').substring(0, 300);

  const bodyHtml = `
    <h2 style="margin:0 0 16px; color:#111827; font-size:20px;">Review your update</h2>
    <p style="margin:0 0 12px; color:#374151; font-size:15px; line-height:1.6;">
      We received your email to update <strong>${escapeHtml(sectionLabel)}</strong>. Here's a preview of the changes:
    </p>
    <div style="background-color:#f9fafb; border: 1px solid #e5e7eb; border-radius:6px; padding: 16px; margin: 16px 0;">
      <p style="margin:0; color:#374151; font-size:14px; line-height:1.6; white-space:pre-wrap;">${escapeHtml(contentPreview)}${contentPreview.length >= 300 ? '...' : ''}</p>
    </div>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td style="background-color:#4F46E5; border-radius:6px;">
          <a href="${previewUrl}" style="display:inline-block; padding: 12px 32px; color:#ffffff; text-decoration:none; font-size:15px; font-weight:600;">
            Preview Changes
          </a>
        </td>
      </tr>
    </table>
    <div style="background-color:#FEF3C7; border: 1px solid #F59E0B; border-radius:6px; padding: 16px; margin: 16px 0;">
      <p style="margin:0; color:#92400E; font-size:14px; font-weight:600;">
        To publish this update, reply to this email with just the word <strong>YES</strong>.
      </p>
    </div>
    <p style="margin:16px 0 0; color:#6b7280; font-size:13px;">
      This update will expire in 1 hour. If you don't confirm, no changes will be made.
    </p>`;

  try {
    await getTransporter().sendMail({
      from: FROM_ADDRESS,
      to: tenant.email,
      subject: `Confirm update to ${sectionLabel} - Reply YES to publish`,
      html: wrapHtml('Confirm your update', bodyHtml),
    });
    logger.info('Confirmation request sent', { email: tenant.email, section: sectionLabel });
  } catch (err) {
    logger.error('Failed to send confirmation request', { email: tenant.email, error: err.message });
    throw err;
  }
}

/**
 * Send a notification that the site has been updated/published.
 *
 * @param {Object} tenant - Tenant record
 * @param {string} section - The section or type that was updated
 */
async function sendPublishedNotification(tenant, section) {
  const siteUrl = `${config.appUrl}/site/${tenant.subdomain}`;

  const bodyHtml = `
    <h2 style="margin:0 0 16px; color:#111827; font-size:20px;">Your site has been updated!</h2>
    <p style="margin:0 0 16px; color:#374151; font-size:15px; line-height:1.6;">
      Your <strong>${escapeHtml(section)}</strong> has been published successfully.
    </p>
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin: 24px 0;">
      <tr>
        <td style="background-color:#059669; border-radius:6px;">
          <a href="${siteUrl}" style="display:inline-block; padding: 12px 32px; color:#ffffff; text-decoration:none; font-size:15px; font-weight:600;">
            View Your Site
          </a>
        </td>
      </tr>
    </table>
    <p style="margin:0; color:#6b7280; font-size:13px;">
      You can always send another email to make more updates.
    </p>`;

  try {
    await getTransporter().sendMail({
      from: FROM_ADDRESS,
      to: tenant.email,
      subject: `Published! Your ${section} has been updated`,
      html: wrapHtml('Site Updated', bodyHtml),
    });
    logger.info('Published notification sent', { email: tenant.email, section });
  } catch (err) {
    logger.error('Failed to send published notification', { email: tenant.email, error: err.message });
    throw err;
  }
}

/**
 * Send a generic reply email (for history, errors, status messages, etc.).
 *
 * @param {string} toEmail - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} body - Plain text or HTML body content
 */
async function sendGenericReply(toEmail, subject, body) {
  const bodyHtml = `
    <div style="color:#374151; font-size:15px; line-height:1.6; white-space:pre-wrap;">${escapeHtml(body)}</div>`;

  try {
    await getTransporter().sendMail({
      from: FROM_ADDRESS,
      to: toEmail,
      subject,
      html: wrapHtml(subject, bodyHtml),
      text: body,
    });
    logger.info('Generic reply sent', { email: toEmail, subject });
  } catch (err) {
    logger.error('Failed to send generic reply', { email: toEmail, subject, error: err.message });
    throw err;
  }
}

/**
 * Escape HTML special characters for safe embedding.
 */
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

module.exports = {
  sendVerificationEmail,
  sendConfirmationRequest,
  sendPublishedNotification,
  sendGenericReply,
  getTransporter,
};
