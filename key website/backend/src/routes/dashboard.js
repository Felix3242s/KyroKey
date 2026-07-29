const express = require('express');
const prisma = require('../lib/prisma');
const { auth, requireRole } = require('../middleware/auth');
const logger = require('../lib/logger');

const router = express.Router();

// Get dashboard statistics
router.get('/stats', auth, requireRole(['ADMIN', 'MODERATOR']), async (req, res) => {
  try {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
    const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);

    const [
      totalLicenses,
      activeLicenses,
      lifetimeLicenses,
      expiredLicenses,
      blockedLicenses,
      pendingLicenses,
      newActivationsToday,
      newActivationsWeek,
      totalUsers,
    ] = await Promise.all([
      prisma.license.count(),
      prisma.license.count({ where: { status: 'ACTIVE' } }),
      prisma.license.count({ where: { duration: 'LIFETIME' } }),
      prisma.license.count({ where: { status: 'EXPIRED' } }),
      prisma.license.count({ where: { status: 'BLOCKED' } }),
      prisma.license.count({ where: { status: 'PENDING' } }),
      prisma.license.count({ where: { activatedAt: { gte: today } } }),
      prisma.license.count({ where: { activatedAt: { gte: weekAgo } } }),
      prisma.user.count(),
    ]);

    // Get license distribution by duration
    const licenseDistribution = await prisma.license.groupBy({
      by: ['duration'],
      _count: true,
    });

    // Get recent activity
    const recentLicenses = await prisma.license.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        createdBy: {
          select: { username: true },
        },
      },
    });

    const recentAuditLogs = await prisma.auditLog.findMany({
      take: 10,
      orderBy: { createdAt: 'desc' },
      include: {
        user: {
          select: { username: true },
        },
      },
    });

    // Get activation trends (last 30 days)
    const activationTrends = [];
    for (let i = 29; i >= 0; i--) {
      const date = new Date(today.getTime() - i * 24 * 60 * 60 * 1000);
      const nextDate = new Date(date.getTime() + 24 * 60 * 60 * 1000);
      
      const count = await prisma.license.count({
        where: {
          activatedAt: {
            gte: date,
            lt: nextDate,
          },
        },
      });

      activationTrends.push({
        date: date.toISOString().split('T')[0],
        count,
      });
    }

    res.json({
      stats: {
        totalLicenses,
        activeLicenses,
        lifetimeLicenses,
        expiredLicenses,
        blockedLicenses,
        pendingLicenses,
        newActivationsToday,
        newActivationsWeek,
        totalUsers,
      },
      licenseDistribution,
      recentLicenses,
      recentAuditLogs,
      activationTrends,
    });
  } catch (error) {
    logger.error('Dashboard stats error:', error);
    res.status(500).json({ error: 'Failed to fetch dashboard stats' });
  }
});

// Get audit logs
router.get('/audit-logs', auth, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { page = 1, limit = 50, action, entityType } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (action) where.action = action;
    if (entityType) where.entityType = entityType;

    const [logs, total] = await Promise.all([
      prisma.auditLog.findMany({
        where,
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
        include: {
          user: {
            select: { username: true, email: true },
          },
        },
      }),
      prisma.auditLog.count({ where }),
    ]);

    res.json({
      logs,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get audit logs error:', error);
    res.status(500).json({ error: 'Failed to fetch audit logs' });
  }
});

module.exports = router;
