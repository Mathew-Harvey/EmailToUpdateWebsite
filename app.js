// app.js
const express = require('express');
const Imap = require('imap');
const simpleParser = require('mailparser').simpleParser;
const { Configuration, OpenAIApi } = require("openai");
const path = require('path');
const winston = require('winston');
const fs = require('fs').promises;

const app = express();
const port = 3000;

require('dotenv').config();

// Configure logger
const logger = winston.createLogger({
  level: 'info', // Reverted back to 'info'
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.File({ filename: 'error.log', level: 'error' }),
    new winston.transports.File({ filename: 'combined.log' }),
    new winston.transports.Console({
      format: winston.format.combine(
        winston.format.colorize(),
        winston.format.simple()
      )
    })
  ]
});

const IMAP_CONFIG = {
  user: process.env.GMAIL_USER,
  password: process.env.GMAIL_APP_PASSWORD,
  host: 'imap.gmail.com',
  port: 993,
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
};

// File to store content
const contentFile = path.join(__dirname, 'content.json');

// Default content
const defaultContent = {
  about: "Default about content",
  contact: "Default contact content",
  blog: []
};

// OpenAI Configuration
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;
const configuration = new Configuration({
  apiKey: OPENAI_API_KEY,
});
const openai = new OpenAIApi(configuration);

// Load content from file
async function loadContent() {
  try {
    await fs.access(contentFile);
    const data = await fs.readFile(contentFile, 'utf8');
    if (!data.trim()) {
      logger.warn('Content file is empty. Using default content.');
      await saveContent(defaultContent);
      return defaultContent;
    }
    try {
      return JSON.parse(data);
    } catch (parseError) {
      logger.error('Error parsing content file:', parseError);
      logger.info('Resetting to default content');
      await saveContent(defaultContent);
      return defaultContent;
    }
  } catch (error) {
    if (error.code === 'ENOENT') {
      logger.info('Content file not found. Creating with default content.');
      await saveContent(defaultContent);
      return defaultContent;
    }
    logger.error('Error loading content:', error);
    return defaultContent;
  }
}

// Save content to file
async function saveContent(content) {
  try {
    await fs.writeFile(contentFile, JSON.stringify(content, null, 2));
    logger.info('Content saved successfully');
  } catch (error) {
    logger.error('Error saving content:', error);
  }
}

function identifyPageFromSubject(subject) {
  subject = subject.toLowerCase();
  if (subject.includes('about')) return 'about';
  if (subject.includes('contact')) return 'contact';
  if (subject.includes('blog')) return 'blog';
  return null;
}

async function extractContentFromBody(emailContent) {
    // Remove any HTML content and extra whitespace
    const plainTextContent = emailContent.replace(/<[^>]*>?/gm, '').trim();
  
    if (!plainTextContent) {
      logger.info('Email body is empty');
      return null;
    }
  
    try {
      const response = await openai.createChatCompletion({
        model: "gpt-3.5-turbo",
        messages: [
          {
            role: "system",
            content: "You are a helpful assistant that generates or extracts content from emails to update website sections. If the email contains instructions to create content, generate the content accordingly."
          },
          {
            role: "user",
            content: `Please generate or extract the content from this email body that should be used to update a website section. If there's no clear content to generate or extract, respond with 'No update content found':\n\n${plainTextContent}`
          }
        ],
        max_tokens: 500 // Increase if necessary
      });
  
      const extractedContent = response.data.choices[0].message.content.trim();
      logger.info(`Extracted content: "${extractedContent}"`);
  
      return extractedContent !== 'No update content found' ? extractedContent : null;
    } catch (error) {
      logger.error('Error extracting content from email body:', error.response ? error.response.data : error.message);
      return null;
    }
  }
  
async function updateContent(page, newContent) {
  const content = await loadContent();
  switch (page) {
    case 'about':
      content.about = newContent;
      logger.info(`Updated about section with content: "${newContent}"`);
      break;
    case 'contact':
      content.contact = newContent;
      logger.info(`Updated contact section with content: "${newContent}"`);
      break;
    case 'blog':
      content.blog.push({
        date: new Date().toISOString().split('T')[0],
        content: newContent
      });
      logger.info(`Added new blog post with content: "${newContent}"`);
      break;
    default:
      logger.warn(`Unknown page: "${page}"`);
  }
  await saveContent(content);
}

async function processEmail(subject, emailContent) {
  logger.info(`Processing email with subject: "${subject}"`);
  logger.info(`Email content: "${emailContent}"`);

  const pageToUpdate = identifyPageFromSubject(subject);
  if (pageToUpdate) {
    const newContent = await extractContentFromBody(emailContent);
    if (newContent) {
      await updateContent(pageToUpdate, newContent);
      logger.info(`Updated ${pageToUpdate} section`);
    } else {
      logger.info('No valid content found in email body');
    }
  } else {
    logger.info('Email subject not recognized for content update');
  }
}

async function checkEmails() {
  const imap = new Imap(IMAP_CONFIG);

  return new Promise((resolve, reject) => {
    imap.once('ready', () => {
      imap.openBox('INBOX', false, async (err, box) => {
        if (err) {
          logger.error('Error opening inbox:', err);
          imap.end();
          return reject(err);
        }
        try {
          const results = await new Promise((resolve, reject) => {
            imap.search(['UNSEEN'], (err, results) => {
              if (err) reject(err);
              else resolve(results);
            });
          });

          if (results.length === 0) {
            logger.info('No new emails');
            imap.end();
            return resolve();
          }

          const f = imap.fetch(results, { bodies: '', markSeen: true });

          f.on('message', (msg) => {
            msg.on('body', (stream, info) => {
              simpleParser(stream, async (err, parsed) => {
                if (err) {
                  logger.error('Error parsing email:', err);
                  return;
                }
                logger.debug('Parsed email:', parsed);

                const emailContent = parsed.text || parsed.html || '';
                await processEmail(parsed.subject || '', emailContent);
              });
            });

            msg.on('attributes', (attrs) => {
              logger.debug('Email attributes:', attrs);
            });
          });

          f.once('error', (err) => {
            logger.error('Fetch error:', err);
          });
          f.once('end', () => {
            logger.info('Finished processing emails');
            imap.end();
            resolve();
          });
        } catch (error) {
          logger.error('Error processing emails:', error);
          imap.end();
          reject(error);
        }
      });
    });

    imap.once('error', (err) => {
      logger.error('IMAP connection error:', err);
      reject(err);
    });

    imap.once('end', () => {
      logger.info('IMAP connection ended');
    });

    imap.connect();
  });
}

// Set up routes
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/about', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'about.html'));
});

app.get('/contact', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'contact.html'));
});

app.get('/blog', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'blog.html'));
});

app.get('/api/content', async (req, res) => {
  try {
    await checkEmails();
    const content = await loadContent();
    res.json(content);
  } catch (error) {
    logger.error('Error checking emails or loading content:', error);
    const fallbackContent = await loadContent(); // Attempt to load content again
    res.status(500).json({
      error: 'An error occurred while processing your request',
      details: error.message,
      content: fallbackContent
    });
  }
});

// Start the server
app.listen(port, () => {
  logger.info(`Server running at http://localhost:${port}`);
});

// Error handling for uncaught exceptions
process.on('uncaughtException', (error) => {
  logger.error('Uncaught Exception:', error);
  process.exit(1);
});

// Error handling for unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
  process.exit(1);
});
