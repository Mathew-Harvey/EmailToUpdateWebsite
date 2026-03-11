const logger = require('../logger');

/**
 * Command patterns mapped from subject-line keywords to structured commands.
 */
const COMMAND_PATTERNS = [
  { pattern: /^(update\s+)?about$/i, command: 'update_section', section: 'about' },
  { pattern: /^(update\s+)?contact$/i, command: 'update_section', section: 'contact' },
  { pattern: /^(update\s+)?services$/i, command: 'update_section', section: 'services' },
  { pattern: /^(update\s+)?hours$/i, command: 'update_section', section: 'hours' },
  { pattern: /^(update\s+)?hero$/i, command: 'update_section', section: 'hero' },
  { pattern: /^(new\s+)?blog(\s+post)?$/i, command: 'new_blog', section: null },
  { pattern: /^yes$/i, command: 'confirm', section: null },
  { pattern: /^confirm$/i, command: 'confirm', section: null },
  { pattern: /^undo$/i, command: 'undo', section: null },
  { pattern: /^history$/i, command: 'history', section: null },
  { pattern: /^send\s+my\s+site$/i, command: 'send_site', section: null },
  { pattern: /^change\s+template\s+(.+)$/i, command: 'change_template', section: null },
  { pattern: /^update\s+title\s+(.+)$/i, command: 'update_title', section: null },
];

/**
 * Strip HTML tags from a string and decode common HTML entities.
 */
function stripHtml(html) {
  if (!html) return '';
  return html
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/p>/gi, '\n\n')
    .replace(/<\/div>/gi, '\n')
    .replace(/<\/li>/gi, '\n')
    .replace(/<[^>]+>/g, '')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#039;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Parse a subject line into a command structure.
 * Returns { command, section, templateName?, title? }
 */
function parseCommand(subject) {
  const trimmed = (subject || '').trim();

  for (const { pattern, command, section } of COMMAND_PATTERNS) {
    const match = trimmed.match(pattern);
    if (match) {
      const result = { command, section };

      if (command === 'change_template' && match[1]) {
        result.templateName = match[1].trim();
      }
      if (command === 'update_title' && match[1]) {
        result.title = match[1].trim();
      }

      return result;
    }
  }

  // Unknown command
  return { command: 'unknown', section: null };
}

/**
 * Extract the sender email address from a parsed email.
 */
function extractSenderEmail(parsed) {
  if (parsed.from && parsed.from.value && parsed.from.value.length > 0) {
    return parsed.from.value[0].address.toLowerCase().trim();
  }
  if (parsed.from && parsed.from.text) {
    const match = parsed.from.text.match(/<([^>]+)>/);
    if (match) return match[1].toLowerCase().trim();
    return parsed.from.text.toLowerCase().trim();
  }
  return null;
}

/**
 * Extract the body text from a parsed email, preferring plaintext.
 */
function extractBody(parsed) {
  if (parsed.text) {
    return parsed.text.trim();
  }
  if (parsed.html) {
    return stripHtml(parsed.html);
  }
  return '';
}

/**
 * Extract image attachments from a parsed email.
 * Returns array of { filename, content (Buffer), contentType }.
 */
function extractImages(parsed) {
  const images = [];

  if (!parsed.attachments || !Array.isArray(parsed.attachments)) {
    return images;
  }

  for (const attachment of parsed.attachments) {
    if (attachment.contentType && attachment.contentType.startsWith('image/')) {
      images.push({
        filename: attachment.filename || `image_${Date.now()}_${images.length}.${attachment.contentType.split('/')[1] || 'png'}`,
        content: attachment.content,
        contentType: attachment.contentType,
      });
    }
  }

  return images;
}

/**
 * Parse an email object (from mailparser) into a structured command object.
 *
 * @param {Object} parsed - A parsed email from mailparser's simpleParser
 * @returns {Object} Structured email data
 */
function parseEmail(parsed) {
  const senderEmail = extractSenderEmail(parsed);
  const rawSubject = (parsed.subject || '').trim();
  const { command, section, templateName, title } = parseCommand(rawSubject);
  const body = extractBody(parsed);
  const images = extractImages(parsed);

  const result = {
    senderEmail,
    command,
    section,
    body,
    images,
    rawSubject,
  };

  if (templateName) {
    result.templateName = templateName;
  }

  if (title) {
    result.title = title;
  }

  logger.debug('Parsed email', {
    senderEmail,
    command,
    section,
    rawSubject,
    bodyLength: body.length,
    imageCount: images.length,
  });

  return result;
}

module.exports = {
  parseEmail,
  parseCommand,
  extractSenderEmail,
  extractBody,
  extractImages,
  stripHtml,
};
