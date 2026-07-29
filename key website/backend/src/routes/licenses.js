const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { auth, requireRole } = require('../middleware/auth');
const { generateLicenseKey, calculateExpiryDate } = require('../lib/security');
const { sendDiscordWebhook } = require('../lib/discord');
const logger = require('../lib/logger');

const router = express.Router();

// Generate license keys
router.post('/generate', auth, requireRole(['ADMIN', 'MODERATOR']), [
  body('duration').isIn(['DAY_1', 'DAY_3', 'DAY_7', 'DAY_30', 'DAY_90', 'LIFETIME']),
  body('count').optional().isInt({ min: 1, max: 100 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { duration, count = 1, note } = req.body;
    const { userId, username } = req.user;

    const licenses = [];
    const expiresAt = calculateExpiryDate(duration);

    for (let i = 0; i < count; i++) {
      const key = generateLicenseKey();
      const license = await prisma.license.create({
        data: {
          key,
          duration,
          status: 'PENDING',
          expiresAt,
          note,
          createdById: userId,
        },
      });
      licenses.push(license);

      await sendDiscordWebhook('KEY_CREATED', {
        key,
        duration,
        createdBy: username,
      });
    }

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'GENERATE_LICENSES',
        entityType: 'License',
        entityId: licenses[0].id,
        details: `Generated ${count} licenses with duration ${duration}`,
        ipAddress: req.ip,
      },
    });

    logger.info(`Generated ${count} licenses by ${username}`);

    res.json({ licenses });
  } catch (error) {
    logger.error('License generation error:', error);
    res.status(500).json({ error: 'Failed to generate licenses' });
  }
});

// Get all licenses with filtering
router.get('/', auth, requireRole(['ADMIN', 'MODERATOR']), async (req, res) => {
  try {
    const { status, search, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (status) where.status = status;
    if (search) {
      where.OR = [
        { key: { contains: search, mode: 'insensitive' } },
        { note: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [licenses, total] = await Promise.all([
      prisma.license.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          createdBy: {
            select: { id: true, username: true, email: true },
          },
        },
      }),
      prisma.license.count({ where }),
    ]);

    res.json({
      licenses,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get licenses error:', error);
    res.status(500).json({ error: 'Failed to fetch licenses' });
  }
});

// Get single license
router.get('/:id', auth, requireRole(['ADMIN', 'MODERATOR']), async (req, res) => {
  try {
    const license = await prisma.license.findUnique({
      where: { id: req.params.id },
      include: {
        createdBy: {
          select: { id: true, username: true, email: true },
        },
        hwidResets: {
          include: {
            resetBy: {
              select: { username: true },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }

    res.json({ license });
  } catch (error) {
    logger.error('Get license error:', error);
    res.status(500).json({ error: 'Failed to fetch license' });
  }
});

// Activate license
router.post('/activate', [
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
      return res.status(404).json({ error: 'Invalid license key' });
    }

    if (license.status === 'BLOCKED') {
      return res.status(403).json({ error: 'License is blocked' });
    }

    if (license.status === 'EXPIRED') {
      return res.status(403).json({ error: 'License has expired' });
    }

    if (license.hwidLocked && license.hwid !== hwid) {
      return res.status(403).json({ error: 'HWID mismatch - license is locked to another device' });
    }

    if (license.status === 'ACTIVE' && license.hwid && license.hwid !== hwid) {
      return res.status(403).json({ error: 'License already activated on another device' });
    }

    const now = new Date();
    if (license.expiresAt && license.expiresAt < now) {
      await prisma.license.update({
        where: { id: license.id },
        data: { status: 'EXPIRED' },
      });
      return res.status(403).json({ error: 'License has expired' });
    }

    const updatedLicense = await prisma.license.update({
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

    logger.info(`License activated: ${license.key}`);

    res.json({
      success: true,
      license: {
        key: updatedLicense.key,
        status: updatedLicense.status,
        expiresAt: updatedLicense.expiresAt,
        duration: updatedLicense.duration,
      },
    license });
  } catch (error) {
    logger.error('License activation error:', error);
    res.status(500).json({ error: 'Failed to activate license' });
  }
});

// Extend license
router.post('/:id/extend', auth, requireRole(['ADMIN', 'MODERATOR']), [
  body('duration').isIn(['DAY_1', 'DAY_3', 'DAY_7', 'DAY_30', 'DAY_90', 'LIFETIME']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { duration } = req.body;
    const { userId, username } = req.user;

    const license = await prisma.license.findUnique({
      where: { id },
    });

    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }

    let newExpiryDate;
    if (duration === 'LIFETIME') {
      newExpiryDate = null;
    } else {
      const baseDate = license.expiresAt && license.expiresAt > new Date() 
        ? license.expiresAt 
        : new Date();
      newExpiryDate = calculateExpiryDate(duration);
      if (baseDate > new Date()) {
        const diffTime = baseDate.getTime() - new Date().getTime();
        const diffDays = diffTime / (1000 * 60 * 60 * 24);
        newExpiryDate = new Date(newExpiryDate.getTime() + diffDays * 24 * 60 * 60 * 1000);
      }
    }

    const updatedLicense = await prisma.license.update({
      where: { id },
      data: {
        duration,
        expiresAt: newExpiryDate,
        status: 'ACTIVE',
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'EXTEND_LICENSE',
        entityType: 'License',
        entityId: id,
        details: `Extended license to ${duration}`,
        ipAddress: req.ip,
      },
    });

    logger.info(`License extended: ${license.key} by ${username}`);

    res.json({ license: updatedLicense });
  } catch (error) {
    logger.error('License extend error:', error);
    res.status(500).json({ error: 'Failed to extend license' });
  }
});

// Block license
router.post('/:id/block', auth, requireRole(['ADMIN', 'MODERATOR']), [
  body('reason').optional().trim(),
], async (req, res) => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const { userId, username } = req.user;

    const license = await prisma.license.update({
      where: { id },
      data: { status: 'BLOCKED' },
    });

    await sendDiscordWebhook('KEY_BLOCKED', {
      key: license.key,
      blockedBy: username,
      reason: reason || 'No reason provided',
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'BLOCK_LICENSE',
        entityType: 'License',
        entityId: id,
        details: `Blocked license. Reason: ${reason || 'No reason'}`,
        ipAddress: req.ip,
      },
    });

    logger.info(`License blocked: ${license.key} by ${username}`);

    res.json({ license });
  } catch (error) {
    logger.error('License block error:', error);
    res.status(500).json({ error: 'Failed to block license' });
  }
});

// Unblock license
router.post('/:id/unblock', auth, requireRole(['ADMIN', 'MODERATOR']), async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, username } = req.user;

    const license = await prisma.license.findUnique({
      where: { id },
    });

    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }

    const status = license.expiresAt && license.expiresAt < new Date() ? 'EXPIRED' : 'ACTIVE';

    const updatedLicense = await prisma.license.update({
      where: { id },
      data: { status },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UNBLOCK_LICENSE',
        entityType: 'License',
        entityId: id,
        details: 'Unblocked license',
        ipAddress: req.ip,
      },
    });

    logger.info(`License unblocked: ${license.key} by ${username}`);

    res.json({ license: updatedLicense });
  } catch (error) {
    logger.error('License unblock error:', error);
    res.status(500).json({ error: 'Failed to unblock license' });
  }
});

// Delete license
router.delete('/:id', auth, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, username } = req.user;

    const license = await prisma.license.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE_LICENSE',
        entityType: 'License',
        entityId: id,
        details: `Deleted license: ${license.key}`,
        ipAddress: req.ip,
      },
    });

    logger.info(`License deleted: ${license.key} by ${username}`);

    res.json({ success: true });
  } catch (error) {
    logger.error('License delete error:', error);
    res.status(500).json({ error: 'Failed to delete license' });
  }
});

// Export licenses
router.get('/export/:format', auth, requireRole(['ADMIN', 'MODERATOR']), async (req, res) => {
  try {
    const { format } = req.params;
    const { status } = req.query;

    const where = status ? { status } : {};
    const licenses = await prisma.license.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    });

    if (format === 'csv') {
      const headers = 'Key,Duration,Status,Expires At,HWID,Created At\n';
      const rows = licenses.map(l => 
        `${l.key},${l.duration},${l.status},${l.expiresAt || 'Lifetime'},${l.hwid || 'N/A'},${l.createdAt}`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=licenses.csv');
      res.send(headers + rows);
    } else if (format === 'txt') {
      const content = licenses.map(l => 
        `${l.key} - ${l.duration} - ${l.status} - ${l.expiresAt || 'Lifetime'}`
      ).join('\n');
      
      res.setHeader('Content-Type', 'text/plain');
      res.setHeader('Content-Disposition', 'attachment; filename=licenses.txt');
      res.send(content);
    } else {
      res.status(400).json({ error: 'Invalid format. Use csv or txt' });
    }
  } catch (error) {
    logger.error('License export error:', error);
    res.status(500).json({ error: 'Failed to export licenses' });
  }
});

module.exports = router;
