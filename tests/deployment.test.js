/**
 * Deployment test suite for EmailSite.
 * These tests verify core functionality without needing external services
 * (no IMAP, SMTP, OpenAI, or Stripe required).
 *
 * Run: node tests/deployment.test.js
 */

const http = require('http');
const assert = require('assert');
const path = require('path');
const fs = require('fs');

// Use a test-specific port and data directory
process.env.PORT = '0'; // Let OS assign a free port
process.env.NODE_ENV = 'test';
process.env.APP_URL = 'http://localhost:3099';

// Generate unique test tenant names to avoid conflicts with existing data
const TEST_ID = Date.now().toString(36);
const TEST_EMAIL = `test-${TEST_ID}@example.com`;
const TEST_SUBDOMAIN = `test-${TEST_ID}`;
const DEPLOY_EMAIL = `deploy-${TEST_ID}@example.com`;
const DEPLOY_SUBDOMAIN = `deploy-${TEST_ID}`;

let server;
let baseUrl;
let passed = 0;
let failed = 0;
const failures = [];

// ─── Test helpers ────────────────────────────────────────────────────────────

async function request(method, urlPath, body) {
  return new Promise((resolve, reject) => {
    const url = new URL(urlPath, baseUrl);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method,
      headers: {},
    };

    if (body) {
      const data = JSON.stringify(body);
      options.headers['Content-Type'] = 'application/json';
      options.headers['Content-Length'] = Buffer.byteLength(data);
    }

    const req = http.request(options, (res) => {
      let responseBody = '';
      res.on('data', (chunk) => { responseBody += chunk; });
      res.on('end', () => {
        let parsed;
        try {
          parsed = JSON.parse(responseBody);
        } catch {
          parsed = responseBody;
        }
        resolve({ status: res.statusCode, body: parsed, headers: res.headers, raw: responseBody });
      });
    });

    req.on('error', reject);
    if (body) req.write(JSON.stringify(body));
    req.end();
  });
}

async function test(name, fn) {
  try {
    await fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (err) {
    failed++;
    failures.push({ name, error: err.message });
    console.log(`  ✗ ${name}`);
    console.log(`    ${err.message}`);
  }
}

// ─── Module loading tests ───────────────────────────────────────────────────

async function runModuleTests() {
  console.log('\n── Module Loading ──');

  await test('config loads without error', () => {
    const config = require('../src/config');
    assert.ok(config.port !== undefined, 'port should be defined');
    assert.ok(config.paths, 'paths should be defined');
    assert.ok(config.paths.templates, 'templates path should be defined');
  });

  await test('logger loads without error', () => {
    const logger = require('../src/logger');
    assert.ok(typeof logger.info === 'function', 'logger.info should be a function');
    assert.ok(typeof logger.error === 'function', 'logger.error should be a function');
  });

  await test('database initializes and creates tables', () => {
    const { db, queries } = require('../src/db');
    assert.ok(db, 'db should be defined');
    assert.ok(queries, 'queries should be defined');

    // Verify tables exist
    const tables = db.prepare("SELECT name FROM sqlite_master WHERE type='table'").all();
    const tableNames = tables.map(t => t.name);
    assert.ok(tableNames.includes('tenants'), 'tenants table should exist');
    assert.ok(tableNames.includes('content'), 'content table should exist');
    assert.ok(tableNames.includes('blog_posts'), 'blog_posts table should exist');
    assert.ok(tableNames.includes('pending_updates'), 'pending_updates table should exist');
    assert.ok(tableNames.includes('uploads'), 'uploads table should exist');
  });

  await test('email parser loads', () => {
    const parser = require('../src/email/parser');
    assert.ok(typeof parser.parseEmail === 'function');
    assert.ok(typeof parser.parseCommand === 'function');
  });

  await test('email sender loads', () => {
    const sender = require('../src/email/sender');
    assert.ok(typeof sender.sendVerificationEmail === 'function');
    assert.ok(typeof sender.sendGenericReply === 'function');
  });

  await test('site generator loads', () => {
    const generator = require('../src/sites/generator');
    assert.ok(typeof generator.generateSite === 'function');
    assert.ok(typeof generator.generatePreview === 'function');
  });

  await test('all 10 templates load', () => {
    const config = require('../src/config');
    const expected = ['starter', 'business', 'portfolio', 'restaurant', 'consultant', 'retail', 'nonprofit', 'personal', 'trades', 'wellness'];
    for (const name of expected) {
      const tmpl = require(path.join(config.paths.templates, name));
      assert.ok(tmpl.name, `${name} template should have a name`);
      assert.ok(typeof tmpl.renderPage === 'function', `${name} template should have renderPage`);
    }
  });
}

// ─── Email parser tests ─────────────────────────────────────────────────────

async function runParserTests() {
  console.log('\n── Email Parser ──');
  const { parseCommand, stripHtml, extractBody, extractImages } = require('../src/email/parser');

  await test('parses "Update About" command', () => {
    const result = parseCommand('Update About');
    assert.strictEqual(result.command, 'update_section');
    assert.strictEqual(result.section, 'about');
  });

  await test('parses "about" as update_section', () => {
    const result = parseCommand('about');
    assert.strictEqual(result.command, 'update_section');
    assert.strictEqual(result.section, 'about');
  });

  await test('parses "New Blog Post" command', () => {
    const result = parseCommand('New Blog Post');
    assert.strictEqual(result.command, 'new_blog');
  });

  await test('parses "YES" as confirm', () => {
    const result = parseCommand('YES');
    assert.strictEqual(result.command, 'confirm');
  });

  await test('parses "CONFIRM" as confirm', () => {
    const result = parseCommand('CONFIRM');
    assert.strictEqual(result.command, 'confirm');
  });

  await test('parses "UNDO" command', () => {
    const result = parseCommand('UNDO');
    assert.strictEqual(result.command, 'undo');
  });

  await test('parses "HISTORY" command', () => {
    const result = parseCommand('HISTORY');
    assert.strictEqual(result.command, 'history');
  });

  await test('parses "SEND MY SITE" command', () => {
    const result = parseCommand('SEND MY SITE');
    assert.strictEqual(result.command, 'send_site');
  });

  await test('parses "CHANGE TEMPLATE modern" command', () => {
    const result = parseCommand('CHANGE TEMPLATE modern');
    assert.strictEqual(result.command, 'change_template');
    assert.strictEqual(result.templateName, 'modern');
  });

  await test('parses "UPDATE TITLE My Cool Site" command', () => {
    const result = parseCommand('UPDATE TITLE My Cool Site');
    assert.strictEqual(result.command, 'update_title');
    assert.strictEqual(result.title, 'My Cool Site');
  });

  await test('returns unknown for unrecognized command', () => {
    const result = parseCommand('random garbage');
    assert.strictEqual(result.command, 'unknown');
  });

  await test('parses case insensitively', () => {
    assert.strictEqual(parseCommand('update about').command, 'update_section');
    assert.strictEqual(parseCommand('UPDATE ABOUT').command, 'update_section');
    assert.strictEqual(parseCommand('Update About').command, 'update_section');
  });

  await test('stripHtml removes tags and decodes entities', () => {
    assert.strictEqual(stripHtml('<p>Hello &amp; World</p>'), 'Hello & World');
    assert.strictEqual(stripHtml('<b>Bold</b>'), 'Bold');
    assert.strictEqual(stripHtml(null), '');
    assert.strictEqual(stripHtml(''), '');
  });

  await test('extractImages returns empty array with no attachments', () => {
    assert.deepStrictEqual(extractImages({}), []);
    assert.deepStrictEqual(extractImages({ attachments: [] }), []);
  });

  await test('extractImages filters to image types only', () => {
    const images = extractImages({
      attachments: [
        { contentType: 'image/png', filename: 'photo.png', content: Buffer.from('png') },
        { contentType: 'application/pdf', filename: 'doc.pdf', content: Buffer.from('pdf') },
        { contentType: 'image/jpeg', filename: 'pic.jpg', content: Buffer.from('jpg') },
      ]
    });
    assert.strictEqual(images.length, 2);
    assert.strictEqual(images[0].filename, 'photo.png');
    assert.strictEqual(images[1].filename, 'pic.jpg');
  });
}

// ─── Database tests ─────────────────────────────────────────────────────────

async function runDatabaseTests() {
  console.log('\n── Database ──');
  const { queries } = require('../src/db');

  let testTenant;

  await test('creates a tenant', () => {
    testTenant = queries.createTenant({
      email: TEST_EMAIL,
      name: 'Test User',
      subdomain: TEST_SUBDOMAIN,
      template: 'starter',
      siteTitle: 'Test Site',
    });
    assert.ok(testTenant.id, 'tenant should have an id');
    assert.strictEqual(testTenant.email, TEST_EMAIL);
    assert.strictEqual(testTenant.subdomain, TEST_SUBDOMAIN);
    assert.strictEqual(testTenant.verified, 0);
    assert.ok(testTenant.verification_token, 'should have a verification token');
    assert.strictEqual(testTenant.subscription_status, 'trialing');
  });

  await test('prevents duplicate email', () => {
    try {
      queries.createTenant({ email: TEST_EMAIL, name: 'Dup', subdomain: 'dup-site' });
      assert.fail('Should have thrown');
    } catch (err) {
      assert.ok(err.message.includes('UNIQUE'), 'should be a uniqueness error');
    }
  });

  await test('prevents duplicate subdomain', () => {
    try {
      queries.createTenant({ email: `other-${TEST_ID}@example.com`, name: 'Other', subdomain: TEST_SUBDOMAIN });
      assert.fail('Should have thrown');
    } catch (err) {
      assert.ok(err.message.includes('UNIQUE'), 'should be a uniqueness error');
    }
  });

  await test('gets tenant by email', () => {
    const t = queries.getTenantByEmail(TEST_EMAIL);
    assert.ok(t);
    assert.strictEqual(t.id, testTenant.id);
  });

  await test('gets tenant by email case-insensitively', () => {
    const t = queries.getTenantByEmail(TEST_EMAIL.toUpperCase());
    // This depends on DB having lowercased on insert
    // The createTenant doesn't lowercase, but getTenantByEmail does trim+lower
    // So this will only work if the email was stored lowercase
    assert.ok(t);
  });

  await test('gets tenant by subdomain', () => {
    const t = queries.getTenantBySubdomain(TEST_SUBDOMAIN);
    assert.ok(t);
    assert.strictEqual(t.id, testTenant.id);
  });

  await test('verifies tenant', () => {
    const verified = queries.verifyTenant(testTenant.verification_token);
    assert.ok(verified);
    assert.strictEqual(verified.verified, 1);
    assert.strictEqual(verified.verification_token, null);
  });

  await test('returns null for invalid verification token', () => {
    const result = queries.verifyTenant('invalid-token');
    assert.strictEqual(result, null);
  });

  await test('creates and retrieves content', () => {
    queries.updateContent(testTenant.id, 'about', 'About content v1');
    const content = queries.getCurrentContent(testTenant.id);
    assert.strictEqual(content.about, 'About content v1');
  });

  await test('updates content with versioning', () => {
    queries.updateContent(testTenant.id, 'about', 'About content v2');
    const content = queries.getCurrentContent(testTenant.id);
    assert.strictEqual(content.about, 'About content v2');

    const history = queries.getContentHistory(testTenant.id, 'about');
    assert.strictEqual(history.length, 2);
    assert.strictEqual(history[0].version, 2);
    assert.strictEqual(history[1].version, 1);
  });

  await test('rolls back content', () => {
    const result = queries.rollbackContent(testTenant.id, 'about', 1);
    assert.ok(result);
    const content = queries.getCurrentContent(testTenant.id);
    assert.strictEqual(content.about, 'About content v1');
  });

  await test('creates blog post', () => {
    const post = queries.createBlogPost(testTenant.id, {
      title: 'Test Post',
      content: 'Blog content',
      imageUrl: null,
      publish: true,
    });
    assert.ok(post.id);
    assert.strictEqual(post.title, 'Test Post');
    assert.strictEqual(post.is_published, 1);
  });

  await test('retrieves published blog posts', () => {
    const posts = queries.getBlogPosts(testTenant.id, false);
    assert.strictEqual(posts.length, 1);
    assert.strictEqual(posts[0].title, 'Test Post');
  });

  await test('creates and retrieves pending update', () => {
    const pending = queries.createPendingUpdate(testTenant.id, {
      updateType: 'section',
      section: 'hero',
      title: null,
      content: 'New hero content',
      imageUrls: [],
    });
    assert.ok(pending.id);
    assert.ok(pending.confirmation_token);
    assert.strictEqual(pending.status, 'pending');
  });

  await test('confirms pending update', () => {
    const pending = queries.getMostRecentPending(testTenant.id);
    assert.ok(pending);
    const confirmed = queries.confirmPending(pending.confirmation_token);
    assert.ok(confirmed);
    assert.strictEqual(confirmed.status, 'confirmed');
  });

  await test('creates and rejects pending update', () => {
    const pending = queries.createPendingUpdate(testTenant.id, {
      updateType: 'section',
      section: 'contact',
      title: null,
      content: 'New contact content',
      imageUrls: [],
    });
    const rejected = queries.rejectPending(pending.confirmation_token);
    assert.ok(rejected);
    assert.strictEqual(rejected.status, 'rejected');
  });

  await test('tenant count works', () => {
    const count = queries.countTenants();
    assert.ok(count >= 1);
  });

  await test('updates tenant template', () => {
    queries.updateTenantTemplate(testTenant.id, 'business');
    const t = queries.getTenantById(testTenant.id);
    assert.strictEqual(t.template, 'business');
  });

  await test('updates tenant site info', () => {
    queries.updateTenantSiteInfo(testTenant.id, 'New Title', 'New Tagline');
    const t = queries.getTenantById(testTenant.id);
    assert.strictEqual(t.site_title, 'New Title');
    assert.strictEqual(t.site_tagline, 'New Tagline');
  });
}

// ─── Site generator tests ───────────────────────────────────────────────────

async function runGeneratorTests() {
  console.log('\n── Site Generator ──');
  const { generateSite, generatePreview } = require('../src/sites/generator');
  const { queries } = require('../src/db');
  const config = require('../src/config');

  const tenant = queries.getTenantBySubdomain(TEST_SUBDOMAIN);
  // Reset template to starter for generation tests
  queries.updateTenantTemplate(tenant.id, 'starter');

  await test('generates site with all pages', () => {
    const updatedTenant = queries.getTenantById(tenant.id);
    const result = generateSite(updatedTenant);
    assert.ok(result.pages.length >= 5, 'should generate at least 5 pages');
    assert.ok(result.outputDir);

    for (const page of ['index', 'about', 'contact', 'services', 'blog']) {
      const filePath = path.join(result.outputDir, `${page}.html`);
      assert.ok(fs.existsSync(filePath), `${page}.html should exist`);
      const content = fs.readFileSync(filePath, 'utf8');
      assert.ok(content.includes('<!DOCTYPE html>') || content.includes('<html'), `${page}.html should be valid HTML`);
    }
  });

  await test('generates preview', () => {
    const updatedTenant = queries.getTenantById(tenant.id);
    const pending = queries.createPendingUpdate(tenant.id, {
      updateType: 'section',
      section: 'about',
      title: null,
      content: 'Preview about content',
      imageUrls: [],
    });

    const result = generatePreview(updatedTenant, pending);
    assert.ok(result.token);
    assert.ok(result.url);

    const previewPath = path.join(config.paths.sites, '_previews', `${pending.confirmation_token}.html`);
    assert.ok(fs.existsSync(previewPath), 'preview file should exist');
  });

  await test('generates site with all 10 templates', () => {
    const templates = ['starter', 'business', 'portfolio', 'restaurant', 'consultant', 'retail', 'nonprofit', 'personal', 'trades', 'wellness'];
    for (const tmpl of templates) {
      queries.updateTenantTemplate(tenant.id, tmpl);
      const updatedTenant = queries.getTenantById(tenant.id);
      const result = generateSite(updatedTenant);
      assert.ok(result.pages.length >= 5, `${tmpl}: should generate pages`);
    }
    // Reset
    queries.updateTenantTemplate(tenant.id, 'starter');
  });
}

// ─── HTTP route tests ───────────────────────────────────────────────────────

async function runRouteTests() {
  console.log('\n── HTTP Routes ──');

  await test('GET / returns landing page', async () => {
    const res = await request('GET', '/');
    assert.strictEqual(res.status, 200);
    assert.ok(typeof res.raw === 'string');
    assert.ok(res.raw.includes('EmailSite'));
  });

  await test('GET /signup returns signup page', async () => {
    const res = await request('GET', '/signup');
    assert.strictEqual(res.status, 200);
    assert.ok(res.raw.includes('Sign Up') || res.raw.includes('sign up') || res.raw.includes('free trial'));
  });

  await test('GET /api/health returns OK', async () => {
    const res = await request('GET', '/api/health');
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.status, 'ok');
    assert.ok(typeof res.body.tenants === 'number');
  });

  await test('GET /api/templates returns template list', async () => {
    const res = await request('GET', '/api/templates');
    assert.strictEqual(res.status, 200);
    assert.ok(Array.isArray(res.body.templates));
    assert.ok(res.body.templates.length >= 10, 'should have at least 10 templates');
  });

  await test('POST /api/signup with valid data succeeds', async () => {
    const res = await request('POST', '/api/signup', {
      email: DEPLOY_EMAIL,
      name: 'Deploy Test',
      subdomain: DEPLOY_SUBDOMAIN,
      template: 'starter',
      siteTitle: 'Deploy Test Site',
    });
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.success);
    assert.ok(res.body.tenant.id);
    assert.strictEqual(res.body.tenant.subdomain, DEPLOY_SUBDOMAIN);
  });

  await test('POST /api/signup with duplicate email returns 409', async () => {
    const res = await request('POST', '/api/signup', {
      email: DEPLOY_EMAIL,
      name: 'Dup',
      subdomain: 'deploy-test-2',
    });
    assert.strictEqual(res.status, 409);
  });

  await test('POST /api/signup with duplicate subdomain returns 409', async () => {
    const res = await request('POST', '/api/signup', {
      email: `other-deploy-${TEST_ID}@example.com`,
      name: 'Other',
      subdomain: DEPLOY_SUBDOMAIN,
    });
    assert.strictEqual(res.status, 409);
  });

  await test('POST /api/signup without email returns 400', async () => {
    const res = await request('POST', '/api/signup', { subdomain: 'test-xyz' });
    assert.strictEqual(res.status, 400);
  });

  await test('POST /api/signup with invalid email returns 400', async () => {
    const res = await request('POST', '/api/signup', { email: 'notanemail', subdomain: 'test-xyz' });
    assert.strictEqual(res.status, 400);
  });

  await test('POST /api/signup with short subdomain returns 400', async () => {
    const res = await request('POST', '/api/signup', { email: `short-${TEST_ID}@test.com`, subdomain: 'ab' });
    assert.strictEqual(res.status, 400);
  });

  await test('GET /site/:subdomain serves generated site', async () => {
    const res = await request('GET', '/site/deploy-test');
    assert.strictEqual(res.status, 200);
    assert.ok(res.raw.includes('html'));
  });

  await test('GET /site/:subdomain/about serves about page', async () => {
    const res = await request('GET', '/site/deploy-test/about');
    assert.strictEqual(res.status, 200);
  });

  await test('GET /site/nonexistent returns 404', async () => {
    const res = await request('GET', '/site/this-does-not-exist-xyz');
    assert.strictEqual(res.status, 404);
  });

  await test('GET /api/tenant/:subdomain returns tenant info', async () => {
    const res = await request('GET', `/api/tenant/${DEPLOY_SUBDOMAIN}`);
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.tenant);
    assert.strictEqual(res.body.tenant.subdomain, DEPLOY_SUBDOMAIN);
  });

  await test('GET /api/content/:subdomain returns content', async () => {
    const res = await request('GET', '/api/content/deploy-test');
    assert.strictEqual(res.status, 200);
    assert.ok(res.body.content !== undefined);
  });

  await test('GET /verify/:token with invalid token returns 404', async () => {
    const res = await request('GET', '/verify/invalid-token-xyz');
    assert.strictEqual(res.status, 404);
  });

  await test('GET nonexistent route returns 404', async () => {
    const res = await request('GET', '/this-does-not-exist');
    assert.strictEqual(res.status, 404);
  });

  await test('CORS headers are present', async () => {
    const res = await request('GET', '/api/health');
    assert.ok(
      res.headers['access-control-allow-origin'],
      'should have CORS origin header'
    );
  });
}

// ─── Security tests ─────────────────────────────────────────────────────────

async function runSecurityTests() {
  console.log('\n── Security ──');

  await test('path traversal in site subdomain is blocked', async () => {
    const res = await request('GET', '/site/../../../etc/passwd');
    assert.ok(res.status === 400 || res.status === 404);
  });

  await test('path traversal in page param is blocked', async () => {
    const res = await request('GET', '/site/test-site/../../etc/passwd');
    assert.ok(res.status === 400 || res.status === 404);
  });

  await test('XSS in subdomain param is neutralized', async () => {
    const res = await request('GET', '/site/<script>alert(1)</script>');
    assert.ok(!res.raw.includes('<script>alert(1)</script>'), 'should not contain raw XSS payload');
  });

  await test('SQL injection in subdomain is handled safely', async () => {
    const res = await request('GET', "/api/tenant/'; DROP TABLE tenants; --");
    assert.ok(res.status === 404 || res.status === 200);
    // Verify tenants table still exists
    const { queries } = require('../src/db');
    const count = queries.countTenants();
    assert.ok(count >= 1, 'tenants table should still exist');
  });
}

// ─── Main test runner ───────────────────────────────────────────────────────

async function main() {
  console.log('═══════════════════════════════════════════════');
  console.log('  EmailSite Deployment Test Suite');
  console.log('═══════════════════════════════════════════════');

  // Run module-level tests first (no server needed)
  await runModuleTests();
  await runParserTests();
  await runDatabaseTests();
  await runGeneratorTests();

  // Start server for HTTP tests
  console.log('\n── Starting test server ──');
  const app = require('../src/index');

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const addr = server.address();
      baseUrl = `http://127.0.0.1:${addr.port}`;
      console.log(`  Test server running on ${baseUrl}`);
      resolve();
    });
  });

  try {
    await runRouteTests();
    await runSecurityTests();
  } finally {
    server.close();
  }

  // ─── Results ──────────────────────────────────────────────────────────────
  console.log('\n═══════════════════════════════════════════════');
  console.log(`  Results: ${passed} passed, ${failed} failed`);
  console.log('═══════════════════════════════════════════════');

  if (failures.length > 0) {
    console.log('\n  Failures:');
    for (const f of failures) {
      console.log(`    ✗ ${f.name}: ${f.error}`);
    }
  }

  console.log('');
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('Test suite crashed:', err);
  process.exit(1);
});
