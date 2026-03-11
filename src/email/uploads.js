const fs = require('fs');
const path = require('path');
const { v4: uuidv4 } = require('uuid');
const config = require('../config');
const { queries } = require('../db');
const logger = require('../logger');

/**
 * Generate a unique filename by prepending a timestamp and short UUID.
 *
 * @param {string} originalFilename - The original filename
 * @returns {string} A unique filename
 */
function generateUniqueFilename(originalFilename) {
  const ext = path.extname(originalFilename || '');
  const baseName = path.basename(originalFilename || 'image', ext);
  const timestamp = Date.now();
  const uniqueId = uuidv4().replace(/-/g, '').substring(0, 8);
  return `${timestamp}_${uniqueId}_${baseName}${ext}`;
}

/**
 * Save uploaded images for a tenant and record them in the database.
 *
 * @param {string} tenantId - The tenant's ID
 * @param {Array<{filename: string, content: Buffer, contentType: string}>} images - Image objects
 * @returns {Promise<string[]>} Array of public URL paths for the saved images
 */
async function saveImages(tenantId, images) {
  if (!images || images.length === 0) {
    return [];
  }

  const tenantDir = path.join(config.paths.uploads, tenantId);

  // Create directories as needed
  fs.mkdirSync(tenantDir, { recursive: true });

  const urls = [];

  for (const image of images) {
    try {
      const uniqueFilename = generateUniqueFilename(image.filename);
      const filePath = path.join(tenantDir, uniqueFilename);

      // Write the image buffer to disk
      fs.writeFileSync(filePath, image.content);

      const url = `/uploads/${tenantId}/${uniqueFilename}`;

      // Record the upload in the database
      queries.createUpload(tenantId, {
        filename: uniqueFilename,
        originalName: image.filename,
        mimeType: image.contentType,
        size: image.content.length,
        url,
      });

      urls.push(url);

      logger.info('Image saved', {
        tenantId,
        filename: uniqueFilename,
        originalName: image.filename,
        size: image.content.length,
        url,
      });
    } catch (err) {
      logger.error('Failed to save image', {
        tenantId,
        filename: image.filename,
        error: err.message,
      });
      // Continue processing remaining images
    }
  }

  return urls;
}

module.exports = {
  saveImages,
  generateUniqueFilename,
};
