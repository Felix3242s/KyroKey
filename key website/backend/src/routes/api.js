const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { generateApiKey } = require('../lib/security');
const logger = require('../lib/logger');

const router = express.Router();

// Public API endpoint for license validation
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
      return res.status(404).json({ 
        valid: false,
        error: 'Invalid license key' 
      });
    }

    if (license.status === 'BLOCKED') {
      return res.status(403).json({ 
        valid: false,
        error: 'License is blocked' 
      });
    }

    if (license.status === 'EXPIRED' || (license.expiresAt && license.expiresAt < new Date())) {
      // Update status if expired but not marked as such
      if (license.status !== 'EXPIRED') {
        await prisma.license.update({
          where: { id: license.id },
          data: { status: 'EXPIRED' },
        });
      }
      return res.status(403).json({ 
        valid: false,
        error: 'License has expired' 
      });
    }

    if (license.hwidLocked && license.hwid !== hwid) {
      return res.status(403).json({ 
        valid: false,
        error: 'HWID mismatch' 
      });
    }

    res.json({
      valid: true,
      license: {
        key: license.key,
        status: license.status,
        duration: license.duration,
        expiresAt: license.expiresAt,
        hwidLocked: license.hwidLocked,
      },
    });
  } catch (error) {
    logger.error('API validate error:', error);
    res.status(500).json({ error: 'Validation failed' });
  }
});

// Get license info
router.post('/info', [
  body('key').notEmpty().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { key } = req.body;

    const license = await prisma.license.findUnique({
      where: { key },
      select: {
        key: true,
        status: true,
        duration: true,
        expiresAt: true,
        hwidLocked: true,
        activatedAt: true,
        createdAt: true,
      },
    });

    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }

    res.json({ license });
  } catch (error) {
    logger.error('API info error:', error);
    res.status(500).json({ error: 'Failed to get license info' });
  }
});

// HWID reset (public API with rate limiting would be applied)
router.post('/reset-hwid', [
  body('key').notEmpty().trim(),
  body('newHwid').notEmpty().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { key, newHwid } = req.body;

    const license = await prisma.license.findUnique({
      where: { key },
      include: {
        hwidResets: {
          orderBy: { createdAt: 'desc' },
          take: parseInt(process.env.HWID_RESET_LIMIT) || 3,
        },
      },
    });

    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }

    if (license.status === 'BLOCKED') {
      return res.status(403).json({ error: 'License is blocked' });
    }

    // Check reset limit
    const resetLimit = parseInt(process.env.HWID_RESET_LIMIT) || 3;
    if (license.hwidResets.length >= resetLimit) {
      return res.status(429).json({ 
        error: 'HWID reset limit reached',
        limit: resetLimit,
      });
    }

    // Check cooldown
    const cooldownDays = parseInt(process.env.HWID_RESET_COOLDOWN_DAYS) || 7;
    if (license.hwidResets.length > 0) {
      const lastReset = license.hwidResets[0].createdAt;
      const cooldownEnd = new Date(lastReset.getTime() + cooldownDays * 24 * 60 * 60 * 1000);
      if (new Date() < cooldownEnd) {
        return res.status(429).json({ 
          error: 'HWID reset cooldown active',
          cooldownEnd,
        });
      }
    }

    const oldHWID = license.hwid;

    await prisma.license.update({
      where: { id: license.id },
      data: {
        hwid: newHwid,
        hwidLocked: true,
      },
    });

    await prisma.hwidReset.create({
      data: {
        licenseId: license.id,
        oldHWID,
        newHWID: newHwid,
        resetById: license.createdById,
        reason: 'API reset',
      },
    });

    logger.info(`HWID reset via API: ${key}`);

    res.json({ success: true });
  } catch (error) {
    logger.error('API HWID reset error:', error);
    res.status(500).json({ error: 'HWID reset failed' });
  }
});

module.exports = router;
