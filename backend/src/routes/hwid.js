const express = require('express');
const { body, validationResult } = express-validator;
const prisma = require('../lib/prisma');
const { auth, requireRole } = require('../middleware/auth');
const { sendDiscordWebhook } = require('../lib/discord');
const logger = require('../lib/logger');

const router = express.Router();

// Reset HWID (admin)
router.post('/:licenseId/reset', auth, requireRole(['ADMIN', 'MODERATOR']), [
  body('newHwid').optional().trim(),
  body('reason').optional().trim(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { licenseId } = req.params;
    const { newHwid, reason } = req.body;
    const { userId, username } = req.user;

    const license = await prisma.license.findUnique({
      where: { id: licenseId },
    });

    if (!license) {
      return res.status(404).json({ error: 'License not found' });
    }

    const oldHWID = license.hwid;

    await prisma.license.update({
      where: { id: licenseId },
      data: {
        hwid: newHwid || null,
        hwidLocked: !!newHwid,
      },
    });

    await prisma.hwidReset.create({
      data: {
        licenseId,
        oldHWID,
        newHWID: newHwid || null,
        resetById: userId,
        reason: reason || 'Manual reset by admin',
      },
    });

    await sendDiscordWebhook('HWID_RESET', {
      key: license.key,
      oldHWID,
      resetBy: username,
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'RESET_HWID',
        entityType: 'License',
        entityId: licenseId,
        details: `Reset HWID for license ${license.key}. Reason: ${reason || 'No reason'}`,
        ipAddress: req.ip,
      },
    });

    logger.info(`HWID reset: ${license.key} by ${username}`);

    res.json({ success: true });
  } catch (error) {
    logger.error('HWID reset error:', error);
    res.status(500).json({ error: 'Failed to reset HWID' });
  }
});

// Get HWID reset history for a license
router.get('/:licenseId/history', auth, requireRole(['ADMIN', 'MODERATOR']), async (req, res) => {
  try {
    const { licenseId } = req.params;

    const history = await prisma.hwidReset.findMany({
      where: { licenseId },
      include: {
        resetBy: {
          select: { username: true, email: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    res.json({ history });
  } catch (error) {
    logger.error('Get HWID history error:', error);
    res.status(500).json({ error: 'Failed to fetch HWID history' });
  }
});

module.exports = router;
