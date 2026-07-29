const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { sendDiscordWebhook } = require('../lib/discord');
const logger = require('../lib/logger');

const router = express.Router();

// Validate license key for loader (no auth required)
router.post('/validate', [
  body('key').notEmpty().trim(),
  body('hwid').notEmpty().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { key, hwid } = req.body;

    const license = await prisma.license.findUnique({
      where: { key },
    });

    if (!license) {
      logger.warn(`Invalid key attempt: ${key} from ${req.ip}`);
      return res.status(404).json({ 
        valid: false, 
        error: 'Invalid license key' 
      });
    }

    if (license.status === 'BLOCKED') {
      logger.warn(`Blocked key attempt: ${key} from ${req.ip}`);
      return res.status(403).json({ 
        valid: false, 
        error: 'License is blocked' 
      });
    }

    if (license.status === 'EXPIRED') {
      return res.status(403).json({ 
        valid: false, 
        error: 'License has expired' 
      });
    }

    // Check HWID lock
    if (license.hwidLocked && license.hwid && license.hwid !== hwid) {
      logger.warn(`HWID mismatch for key: ${key} from ${req.ip}`);
      return res.status(403).json({ 
        valid: false, 
        error: 'HWID mismatch - license is locked to another device' 
      });
    }

    // Check expiration
    const now = new Date();
    if (license.expiresAt && license.expiresAt < now) {
      await prisma.license.update({
        where: { id: license.id },
        data: { status: 'EXPIRED' },
      });
      return res.status(403).json({ 
        valid: false, 
        error: 'License has expired' 
      });
    }

    // Activate license if not already active
    if (license.status === 'PENDING' || !license.hwid) {
      await prisma.license.update({
        where: { id: license.id },
        data: {
          status: 'ACTIVE',
          hwid,
          hwidLocked: true,
          activatedAt: now,
        },
      });

      await sendDiscordWebhook('KEY_ACTIVATED', {
        key: license.key,
        hwid,
        ipAddress: req.ip,
      });

      logger.info(`License activated: ${license.key} for HWID: ${hwid}`);
    }

    res.json({ 
      valid: true,
      license: {
        key: license.key,
        status: license.status,
        expiresAt: license.expiresAt,
        duration: license.duration,
        product: license.product || 'Standard',
      }
    });
  } catch (error) {
    logger.error('License validation error:', error);
    res.status(500).json({ 
      valid: false, 
      error: 'Failed to validate license' 
    });
  }
});

// Get license info (no auth required for loader)
router.post('/info', [
  body('key').notEmpty().trim(),
], async (req, res) => {
  try {
    const { key } = req.body;

    const license = await prisma.license.findUnique({
      where: { key },
    });

    if (!license) {
      return res.status(404).json({ 
        found: false,
        error: 'License not found' 
      });
    }

    res.json({ 
      found: true,
      license: {
        key: license.key,
        status: license.status,
        expiresAt: license.expiresAt,
        duration: license.duration,
        product: license.product || 'Standard',
        hwidLocked: license.hwidLocked,
      }
    });
  } catch (error) {
    logger.error('License info error:', error);
    res.status(500).json({ 
      found: false,
      error: 'Failed to get license info' 
    });
  }
});

module.exports = router;
