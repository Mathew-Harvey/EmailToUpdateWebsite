const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');
const config = require('./config');

fs.mkdirSync(config.paths.data, { recursive: true });

const db = new Database(path.join(config.paths.data, 'emailsite.db'));

// Enable WAL mode for better concurrent read performance
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

// ─── Schema ────────────────────────────────────────────────────────────────────

db.exec(`
  CREATE TABLE IF NOT EXISTS tenants (
    id TEXT PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL DEFAULT '',
    subdomain TEXT UNIQUE NOT NULL,
    custom_domain TEXT UNIQUE,
    template TEXT NOT NULL DEFAULT 'starter',
    site_title TEXT NOT NULL DEFAULT 'My Website',
    site_tagline TEXT NOT NULL DEFAULT '',
    stripe_customer_id TEXT,
    stripe_subscription_id TEXT,
    subscription_status TEXT NOT NULL DEFAULT 'trialing',
    trial_ends_at TEXT,
    verified INTEGER NOT NULL DEFAULT 0,
    verification_token TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS content (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    section TEXT NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    version INTEGER NOT NULL DEFAULT 1,
    is_current INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(tenant_id, section, version)
  );

  CREATE TABLE IF NOT EXISTS blog_posts (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    title TEXT NOT NULL DEFAULT '',
    content TEXT NOT NULL,
    image_url TEXT,
    is_published INTEGER NOT NULL DEFAULT 0,
    published_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS pending_updates (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    update_type TEXT NOT NULL,
    section TEXT,
    title TEXT,
    content TEXT NOT NULL,
    image_urls TEXT DEFAULT '[]',
    confirmation_token TEXT UNIQUE NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    expires_at TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE TABLE IF NOT EXISTS uploads (
    id TEXT PRIMARY KEY,
    tenant_id TEXT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
    filename TEXT NOT NULL,
    original_name TEXT,
    mime_type TEXT,
    size INTEGER,
    url TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_content_tenant ON content(tenant_id, section, is_current);
  CREATE INDEX IF NOT EXISTS idx_blog_tenant ON blog_posts(tenant_id, is_published);
  CREATE INDEX IF NOT EXISTS idx_pending_token ON pending_updates(confirmation_token);
  CREATE INDEX IF NOT EXISTS idx_pending_tenant ON pending_updates(tenant_id, status);
  CREATE INDEX IF NOT EXISTS idx_tenant_email ON tenants(email);
  CREATE INDEX IF NOT EXISTS idx_tenant_subdomain ON tenants(subdomain);
  CREATE INDEX IF NOT EXISTS idx_tenant_custom_domain ON tenants(custom_domain);
`);

// ─── Prepared Statements ───────────────────────────────────────────────────────

const stmts = {
  // Tenants
  createTenant: db.prepare(`
    INSERT INTO tenants (id, email, name, subdomain, template, site_title, verification_token, trial_ends_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now', '+14 days'))
  `),
  getTenantByEmail: db.prepare('SELECT * FROM tenants WHERE email = ?'),
  getTenantById: db.prepare('SELECT * FROM tenants WHERE id = ?'),
  getTenantBySubdomain: db.prepare('SELECT * FROM tenants WHERE subdomain = ?'),
  getTenantByCustomDomain: db.prepare('SELECT * FROM tenants WHERE custom_domain = ?'),
  getTenantByVerificationToken: db.prepare('SELECT * FROM tenants WHERE verification_token = ?'),
  verifyTenant: db.prepare('UPDATE tenants SET verified = 1, verification_token = NULL, updated_at = datetime(\'now\') WHERE id = ?'),
  updateTenantTemplate: db.prepare('UPDATE tenants SET template = ?, updated_at = datetime(\'now\') WHERE id = ?'),
  updateTenantSiteInfo: db.prepare('UPDATE tenants SET site_title = ?, site_tagline = ?, updated_at = datetime(\'now\') WHERE id = ?'),
  updateTenantStripe: db.prepare('UPDATE tenants SET stripe_customer_id = ?, stripe_subscription_id = ?, subscription_status = ?, updated_at = datetime(\'now\') WHERE id = ?'),
  updateSubscriptionStatus: db.prepare('UPDATE tenants SET subscription_status = ?, updated_at = datetime(\'now\') WHERE stripe_subscription_id = ?'),
  setCustomDomain: db.prepare('UPDATE tenants SET custom_domain = ?, updated_at = datetime(\'now\') WHERE id = ?'),
  listTenants: db.prepare('SELECT id, email, subdomain, subscription_status, created_at FROM tenants ORDER BY created_at DESC'),
  countTenants: db.prepare('SELECT COUNT(*) as count FROM tenants'),

  // Content
  setContent: db.prepare(`
    INSERT INTO content (id, tenant_id, section, content, version, is_current)
    VALUES (?, ?, ?, ?, ?, 1)
  `),
  unsetCurrentContent: db.prepare('UPDATE content SET is_current = 0 WHERE tenant_id = ? AND section = ? AND is_current = 1'),
  getCurrentContent: db.prepare('SELECT * FROM content WHERE tenant_id = ? AND section = ? AND is_current = 1'),
  getAllCurrentContent: db.prepare('SELECT * FROM content WHERE tenant_id = ? AND is_current = 1'),
  getContentHistory: db.prepare('SELECT * FROM content WHERE tenant_id = ? AND section = ? ORDER BY version DESC LIMIT 20'),
  getContentVersion: db.prepare('SELECT * FROM content WHERE tenant_id = ? AND section = ? AND version = ?'),
  getMaxVersion: db.prepare('SELECT MAX(version) as max_version FROM content WHERE tenant_id = ? AND section = ?'),

  // Blog Posts
  createBlogPost: db.prepare(`
    INSERT INTO blog_posts (id, tenant_id, title, content, image_url, is_published, published_at)
    VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
  `),
  getBlogPosts: db.prepare('SELECT * FROM blog_posts WHERE tenant_id = ? AND is_published = 1 ORDER BY published_at DESC'),
  getAllBlogPosts: db.prepare('SELECT * FROM blog_posts WHERE tenant_id = ? ORDER BY created_at DESC'),
  getBlogPost: db.prepare('SELECT * FROM blog_posts WHERE id = ? AND tenant_id = ?'),
  deleteBlogPost: db.prepare('DELETE FROM blog_posts WHERE id = ? AND tenant_id = ?'),

  // Pending Updates
  createPendingUpdate: db.prepare(`
    INSERT INTO pending_updates (id, tenant_id, update_type, section, title, content, image_urls, confirmation_token, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+1 hour'))
  `),
  getPendingByToken: db.prepare('SELECT * FROM pending_updates WHERE confirmation_token = ? AND status = \'pending\' AND expires_at > datetime(\'now\')'),
  getPendingByTenant: db.prepare('SELECT * FROM pending_updates WHERE tenant_id = ? AND status = \'pending\' AND expires_at > datetime(\'now\') ORDER BY created_at DESC LIMIT 1'),
  confirmPendingUpdate: db.prepare('UPDATE pending_updates SET status = \'confirmed\' WHERE id = ?'),
  rejectPendingUpdate: db.prepare('UPDATE pending_updates SET status = \'rejected\' WHERE id = ?'),
  expirePendingUpdates: db.prepare('UPDATE pending_updates SET status = \'expired\' WHERE status = \'pending\' AND expires_at <= datetime(\'now\')'),

  // Uploads
  createUpload: db.prepare('INSERT INTO uploads (id, tenant_id, filename, original_name, mime_type, size, url) VALUES (?, ?, ?, ?, ?, ?, ?)'),
  getUploadsByTenant: db.prepare('SELECT * FROM uploads WHERE tenant_id = ? ORDER BY created_at DESC'),
};

// ─── Helper Functions ──────────────────────────────────────────────────────────

const { v4: uuidv4 } = require('uuid');

const queries = {
  createTenant({ email, name, subdomain, template, siteTitle }) {
    const id = uuidv4();
    const verificationToken = uuidv4();
    stmts.createTenant.run(id, email.toLowerCase().trim(), name || '', subdomain, template || 'starter', siteTitle || 'My Website', verificationToken);
    return stmts.getTenantById.get(id);
  },

  getTenantByEmail(email) {
    return stmts.getTenantByEmail.get(email.toLowerCase().trim());
  },

  getTenantById(id) {
    return stmts.getTenantById.get(id);
  },

  getTenantBySubdomain(subdomain) {
    return stmts.getTenantBySubdomain.get(subdomain);
  },

  getTenantByDomain(domain) {
    return stmts.getTenantByCustomDomain.get(domain) || stmts.getTenantBySubdomain.get(domain.split('.')[0]);
  },

  verifyTenant(token) {
    const tenant = stmts.getTenantByVerificationToken.get(token);
    if (!tenant) return null;
    stmts.verifyTenant.run(tenant.id);
    return stmts.getTenantById.get(tenant.id);
  },

  updateContent(tenantId, section, content) {
    const maxRow = stmts.getMaxVersion.get(tenantId, section);
    const newVersion = (maxRow?.max_version || 0) + 1;
    const id = uuidv4();

    const txn = db.transaction(() => {
      stmts.unsetCurrentContent.run(tenantId, section);
      stmts.setContent.run(id, tenantId, section, content, newVersion);
    });
    txn();

    return stmts.getCurrentContent.get(tenantId, section);
  },

  getCurrentContent(tenantId) {
    const rows = stmts.getAllCurrentContent.all(tenantId);
    const content = {};
    for (const row of rows) {
      content[row.section] = row.content;
    }
    return content;
  },

  getContentHistory(tenantId, section) {
    return stmts.getContentHistory.all(tenantId, section);
  },

  rollbackContent(tenantId, section, toVersion) {
    const old = stmts.getContentVersion.get(tenantId, section, toVersion);
    if (!old) return null;
    return queries.updateContent(tenantId, section, old.content);
  },

  createBlogPost(tenantId, { title, content, imageUrl, publish }) {
    const id = uuidv4();
    stmts.createBlogPost.run(id, tenantId, title || '', content, imageUrl || null, publish ? 1 : 0);
    return stmts.getBlogPost.get(id, tenantId);
  },

  getBlogPosts(tenantId, includeUnpublished) {
    return includeUnpublished
      ? stmts.getAllBlogPosts.all(tenantId)
      : stmts.getBlogPosts.all(tenantId);
  },

  deleteBlogPost(tenantId, postId) {
    return stmts.deleteBlogPost.run(postId, tenantId);
  },

  createPendingUpdate(tenantId, { updateType, section, title, content, imageUrls }) {
    const id = uuidv4();
    const token = uuidv4().replace(/-/g, '').substring(0, 16);
    stmts.createPendingUpdate.run(id, tenantId, updateType, section || null, title || null, content, JSON.stringify(imageUrls || []), token);
    return stmts.getPendingByToken.get(token);
  },

  getPendingByToken(token) {
    return stmts.getPendingByToken.get(token);
  },

  getMostRecentPending(tenantId) {
    return stmts.getPendingByTenant.get(tenantId);
  },

  confirmPending(token) {
    const pending = stmts.getPendingByToken.get(token);
    if (!pending) return null;
    stmts.confirmPendingUpdate.run(pending.id);
    return { ...pending, status: 'confirmed' };
  },

  rejectPending(token) {
    const pending = stmts.getPendingByToken.get(token);
    if (!pending) return null;
    stmts.rejectPendingUpdate.run(pending.id);
    return { ...pending, status: 'rejected' };
  },

  expirePendingUpdates() {
    return stmts.expirePendingUpdates.run();
  },

  createUpload(tenantId, { filename, originalName, mimeType, size, url }) {
    const id = uuidv4();
    stmts.createUpload.run(id, tenantId, filename, originalName, mimeType, size, url);
    return { id, tenantId, filename, originalName, mimeType, size, url };
  },

  updateTenantStripe(tenantId, { customerId, subscriptionId, status }) {
    stmts.updateTenantStripe.run(customerId, subscriptionId, status, tenantId);
  },

  updateSubscriptionStatus(subscriptionId, status) {
    stmts.updateSubscriptionStatus.run(status, subscriptionId);
  },

  setCustomDomain(tenantId, domain) {
    stmts.setCustomDomain.run(domain, tenantId);
  },

  updateTenantTemplate(tenantId, template) {
    stmts.updateTenantTemplate.run(template, tenantId);
  },

  updateTenantSiteInfo(tenantId, title, tagline) {
    stmts.updateTenantSiteInfo.run(title, tagline, tenantId);
  },

  listTenants() {
    return stmts.listTenants.all();
  },

  countTenants() {
    return stmts.countTenants.get().count;
  },
};

module.exports = { db, queries };
