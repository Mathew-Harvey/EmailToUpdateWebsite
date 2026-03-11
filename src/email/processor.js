const OpenAI = require('openai');
const config = require('../config');
const { queries } = require('../db');
const logger = require('../logger');
const { saveImages } = require('./uploads');
const sender = require('./sender');
const { generateSite, generatePreview } = require('../sites/generator');

let openai = null;
try {
  if (config.openai.apiKey) {
    openai = new OpenAI({ apiKey: config.openai.apiKey });
  }
} catch (err) {
  logger.warn('OpenAI not initialized', { error: err.message });
}

/**
 * Use GPT to extract and clean up website content from an email body.
 *
 * @param {string} emailBody - Raw email body text
 * @param {string} section - The website section being updated (e.g. 'about', 'hero')
 * @returns {Promise<string>} Cleaned content suitable for a website section
 */
async function extractContent(emailBody, section) {
  if (!openai) {
    logger.warn('OpenAI not configured, using raw email body');
    return emailBody;
  }
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: `You are a content editor for a website. The user is sending an email to update the "${section}" section of their website. Extract and format the website content from their email. Remove any email signatures, greetings, or conversational text that is not part of the website content. Return clean, well-formatted content suitable for displaying on a website section. Use markdown formatting where appropriate (headings, lists, bold, etc.). Do not add content that was not in the original email. Do not wrap the output in code blocks.`,
        },
        {
          role: 'user',
          content: emailBody,
        },
      ],
      temperature: 0.3,
      max_tokens: 2000,
    });

    return response.choices[0].message.content.trim();
  } catch (err) {
    logger.error('OpenAI content extraction failed', { error: err.message, section });
    // Fall back to raw body if AI extraction fails
    return emailBody;
  }
}

/**
 * Process a parsed email and execute the appropriate command.
 *
 * @param {Object} emailData - Structured email data from parser.js
 * @param {string} emailData.senderEmail - Sender's email address
 * @param {string} emailData.command - Parsed command
 * @param {string|null} emailData.section - Target section (for update commands)
 * @param {string} emailData.body - Email body text
 * @param {Array} emailData.images - Array of image attachments
 * @param {string} emailData.rawSubject - Original subject line
 * @param {string} [emailData.templateName] - Template name (for change_template)
 * @param {string} [emailData.title] - Title (for update_title)
 */
async function processEmail(emailData) {
  const { senderEmail, command, section, body, images, rawSubject } = emailData;

  if (!senderEmail) {
    logger.warn('Email with no sender address, ignoring');
    return;
  }

  // Look up tenant by sender email
  const tenant = queries.getTenantByEmail(senderEmail);

  if (!tenant) {
    logger.warn('Email from unknown sender, ignoring', { senderEmail });
    return;
  }

  if (!tenant.verified) {
    logger.warn('Email from unverified tenant, ignoring', { senderEmail, tenantId: tenant.id });
    return;
  }

  // Check subscription status
  const isTrialExpired = tenant.subscription_status === 'trialing' && tenant.trial_ends_at && new Date(tenant.trial_ends_at) < new Date();
  if (tenant.subscription_status === 'canceled' || isTrialExpired) {
    logger.info('Email from inactive subscription', { senderEmail, tenantId: tenant.id, status: tenant.subscription_status });
    await sender.sendGenericReply(
      tenant.email,
      'Subscription Inactive',
      'Your subscription is inactive. Please reactivate your subscription to continue updating your website.'
    );
    return;
  }

  logger.info('Processing email command', {
    senderEmail,
    command,
    section,
    tenantId: tenant.id,
  });

  try {
    switch (command) {
      case 'update_section':
        await handleUpdateSection(tenant, section, body, images);
        break;

      case 'new_blog':
        await handleNewBlog(tenant, body, images, rawSubject);
        break;

      case 'confirm':
        await handleConfirm(tenant);
        break;

      case 'undo':
        await handleUndo(tenant);
        break;

      case 'history':
        await handleHistory(tenant);
        break;

      case 'send_site':
        await handleSendSite(tenant);
        break;

      case 'change_template':
        await handleChangeTemplate(tenant, emailData.templateName);
        break;

      case 'update_title':
        await handleUpdateTitle(tenant, emailData.title, body);
        break;

      default:
        logger.warn('Unknown command received', { senderEmail, rawSubject, command });
        await sender.sendGenericReply(
          tenant.email,
          'Unknown Command',
          `We didn't recognize the command in your subject line: "${rawSubject}"\n\nSupported commands:\n- Update About\n- Update Contact\n- Update Services\n- Update Hours\n- Update Hero\n- New Blog Post\n- YES / CONFIRM\n- UNDO\n- HISTORY\n- SEND MY SITE\n- CHANGE TEMPLATE <name>\n- UPDATE TITLE <title>`
        );
        break;
    }
  } catch (err) {
    logger.error('Error processing email command', {
      senderEmail,
      command,
      section,
      error: err.message,
      stack: err.stack,
    });
    await sender.sendGenericReply(
      tenant.email,
      'Error Processing Your Request',
      'Sorry, we encountered an error while processing your request. Please try again. If the problem persists, contact support.'
    );
  }
}

/**
 * Handle content section updates (about, contact, services, hours, hero).
 */
async function handleUpdateSection(tenant, section, body, images) {
  // Use OpenAI to extract and clean up content
  const cleanedContent = await extractContent(body, section);

  // Save any attached images
  const imageUrls = await saveImages(tenant.id, images);

  // Create a pending update record
  const pendingUpdate = queries.createPendingUpdate(tenant.id, {
    updateType: 'section',
    section,
    title: null,
    content: cleanedContent,
    imageUrls,
  });

  // Generate preview HTML page
  generatePreview(tenant, pendingUpdate);
  const previewUrl = `${config.appUrl}/preview/${pendingUpdate.confirmation_token}`;

  // Send confirmation email with preview link
  await sender.sendConfirmationRequest(tenant, pendingUpdate, previewUrl);

  logger.info('Section update pending', {
    tenantId: tenant.id,
    section,
    token: pendingUpdate.confirmation_token,
  });
}

/**
 * Handle new blog post creation.
 */
async function handleNewBlog(tenant, body, images, rawSubject) {
  // Extract title: use first line of body, or fall back to subject
  const lines = body.split('\n').filter(line => line.trim());
  let title = lines.length > 0 ? lines[0].trim() : rawSubject;
  let content = lines.length > 1 ? lines.slice(1).join('\n').trim() : body;

  // If title came from the body's first line, use the rest as content
  // If the title is too long, it's probably not a title - use subject instead
  if (title.length > 120) {
    title = rawSubject.replace(/^(new\s+)?blog(\s+post)?:?\s*/i, '').trim() || 'Untitled Post';
    content = body;
  }

  // Clean up content with AI
  const cleanedContent = await extractContent(content, 'blog post');

  // Save any attached images
  const imageUrls = await saveImages(tenant.id, images);

  // Create pending update
  const pendingUpdate = queries.createPendingUpdate(tenant.id, {
    updateType: 'blog',
    section: null,
    title,
    content: cleanedContent,
    imageUrls,
  });

  // Generate preview HTML page
  generatePreview(tenant, pendingUpdate);
  const previewUrl = `${config.appUrl}/preview/${pendingUpdate.confirmation_token}`;

  // Send confirmation email
  await sender.sendConfirmationRequest(tenant, pendingUpdate, previewUrl);

  logger.info('Blog post pending', {
    tenantId: tenant.id,
    title,
    token: pendingUpdate.confirmation_token,
  });
}

/**
 * Handle YES / CONFIRM commands - publish the most recent pending update.
 */
async function handleConfirm(tenant) {
  const pending = queries.getMostRecentPending(tenant.id);

  if (!pending) {
    await sender.sendGenericReply(
      tenant.email,
      'No Pending Updates',
      'You don\'t have any pending updates to confirm. Send an email with a command like "Update About" to create an update.'
    );
    return;
  }

  // Confirm the pending update
  queries.confirmPending(pending.confirmation_token);

  let sectionLabel;

  if (pending.update_type === 'blog') {
    // Create the blog post
    const imageUrls = JSON.parse(pending.image_urls || '[]');
    queries.createBlogPost(tenant.id, {
      title: pending.title || 'Untitled Post',
      content: pending.content,
      imageUrl: imageUrls.length > 0 ? imageUrls[0] : null,
      publish: true,
    });
    sectionLabel = 'blog post';
  } else {
    // Update the content section
    queries.updateContent(tenant.id, pending.section, pending.content);
    sectionLabel = pending.section;
  }

  // Regenerate the static site
  await generateSite(tenant);

  // Send published notification
  await sender.sendPublishedNotification(tenant, sectionLabel);

  logger.info('Update published', {
    tenantId: tenant.id,
    updateType: pending.update_type,
    section: pending.section,
  });
}

/**
 * Handle UNDO command - roll back the most recently updated section.
 */
async function handleUndo(tenant) {
  // Get all current content to find the most recently updated section
  const allContent = queries.getCurrentContent(tenant.id);
  const sections = Object.keys(allContent);

  if (sections.length === 0) {
    await sender.sendGenericReply(
      tenant.email,
      'Nothing to Undo',
      'There is no content history to undo.'
    );
    return;
  }

  // Find the section with the most recent update by checking history
  let mostRecentSection = null;
  let mostRecentDate = null;

  for (const section of sections) {
    const history = queries.getContentHistory(tenant.id, section);
    if (history.length > 1) {
      const latestDate = new Date(history[0].created_at);
      if (!mostRecentDate || latestDate > mostRecentDate) {
        mostRecentDate = latestDate;
        mostRecentSection = section;
      }
    }
  }

  if (!mostRecentSection) {
    await sender.sendGenericReply(
      tenant.email,
      'Nothing to Undo',
      'There are no previous versions to roll back to.'
    );
    return;
  }

  // Roll back to the previous version
  const history = queries.getContentHistory(tenant.id, mostRecentSection);
  if (history.length < 2) {
    await sender.sendGenericReply(
      tenant.email,
      'Nothing to Undo',
      'There are no previous versions to roll back to.'
    );
    return;
  }
  const previousVersion = history[1].version;

  const rolledBack = queries.rollbackContent(tenant.id, mostRecentSection, previousVersion);

  if (!rolledBack) {
    await sender.sendGenericReply(
      tenant.email,
      'Undo Failed',
      'Unable to roll back to the previous version. Please try again.'
    );
    return;
  }

  // Regenerate the static site
  await generateSite(tenant);

  // Send confirmation
  await sender.sendPublishedNotification(tenant, `${mostRecentSection} (rolled back)`);

  logger.info('Content rolled back', {
    tenantId: tenant.id,
    section: mostRecentSection,
    toVersion: previousVersion,
  });
}

/**
 * Handle HISTORY command - send a summary of all content sections and versions.
 */
async function handleHistory(tenant) {
  const sections = ['hero', 'about', 'contact', 'services', 'hours'];
  const lines = ['Content History for your site:\n'];

  for (const section of sections) {
    const history = queries.getContentHistory(tenant.id, section);
    if (history.length > 0) {
      lines.push(`${section.toUpperCase()}: ${history.length} version(s), last updated ${history[0].created_at}`);
    } else {
      lines.push(`${section.toUpperCase()}: No content yet`);
    }
  }

  // Include blog post count
  const blogPosts = queries.getBlogPosts(tenant.id, true);
  lines.push(`\nBLOG POSTS: ${blogPosts.length} total`);

  if (blogPosts.length > 0) {
    for (const post of blogPosts.slice(0, 10)) {
      const status = post.is_published ? 'published' : 'draft';
      lines.push(`  - "${post.title}" (${status}, ${post.created_at})`);
    }
  }

  await sender.sendGenericReply(
    tenant.email,
    'Your Site History',
    lines.join('\n')
  );

  logger.info('History sent', { tenantId: tenant.id });
}

/**
 * Handle SEND MY SITE command - email back the current site URL.
 */
async function handleSendSite(tenant) {
  const siteUrl = tenant.custom_domain
    ? `https://${tenant.custom_domain}`
    : `${config.appUrl}/site/${tenant.subdomain}`;

  await sender.sendGenericReply(
    tenant.email,
    'Your Website',
    `Here is your website URL:\n\n${siteUrl}\n\nYou can share this link with anyone. Your site is live and accessible 24/7.`
  );

  logger.info('Site URL sent', { tenantId: tenant.id, siteUrl });
}

/**
 * Handle CHANGE TEMPLATE command - switch the site template.
 */
async function handleChangeTemplate(tenant, templateName) {
  if (!templateName) {
    await sender.sendGenericReply(
      tenant.email,
      'Template Name Required',
      'Please specify a template name in the subject line. Example: CHANGE TEMPLATE modern'
    );
    return;
  }

  // Update tenant template
  queries.updateTenantTemplate(tenant.id, templateName);

  // Regenerate the static site with the new template
  const updatedTenant = queries.getTenantById(tenant.id);
  await generateSite(updatedTenant);

  // Send confirmation
  await sender.sendGenericReply(
    tenant.email,
    'Template Changed',
    `Your site template has been changed to "${templateName}" and your site has been regenerated. Visit your site to see the changes.`
  );

  logger.info('Template changed', { tenantId: tenant.id, template: templateName });
}

/**
 * Handle UPDATE TITLE command - change the site title.
 */
async function handleUpdateTitle(tenant, title, body) {
  // Use title from subject if available, otherwise use body
  const newTitle = title || body.split('\n')[0].trim();

  if (!newTitle) {
    await sender.sendGenericReply(
      tenant.email,
      'Title Required',
      'Please provide a title in the subject line or email body. Example: UPDATE TITLE My Awesome Website'
    );
    return;
  }

  // Update tenant site info (keep existing tagline)
  queries.updateTenantSiteInfo(tenant.id, newTitle, tenant.site_tagline || '');

  // Regenerate the static site
  const updatedTenant = queries.getTenantById(tenant.id);
  await generateSite(updatedTenant);

  // Send confirmation
  await sender.sendGenericReply(
    tenant.email,
    'Site Title Updated',
    `Your site title has been changed to "${newTitle}" and your site has been regenerated.`
  );

  logger.info('Title updated', { tenantId: tenant.id, title: newTitle });
}

module.exports = {
  processEmail,
  extractContent,
};
