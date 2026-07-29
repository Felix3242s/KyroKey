const express = require('express');
const { body, validationResult } = require('express-validator');
const prisma = require('../lib/prisma');
const { auth, requireRole } = require('../middleware/auth');
const { hashPassword } = require('../lib/security');
const logger = require('../lib/logger');

const router = express.Router();

// Get all users
router.get('/', auth, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { search, role, page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const where = {};
    if (role) where.role = role;
    if (search) {
      where.OR = [
        { username: { contains: search, mode: 'insensitive' } },
        { email: { contains: search, mode: 'insensitive' } },
      ];
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: parseInt(limit),
        select: {
          id: true,
          email: true,
          username: true,
          role: true,
          twoFactorEnabled: true,
          createdAt: true,
          lastLogin: true,
          _count: {
            select: {
              createdLicenses: true,
              loginHistory: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    res.json({
      users,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get users error:', error);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// Get single user
router.get('/:id', auth, requireRole(['ADMIN']), async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.params.id },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        twoFactorEnabled: true,
        createdAt: true,
        lastLogin: true,
        createdLicenses: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        loginHistory: {
          take: 20,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({ user });
  } catch (error) {
    logger.error('Get user error:', error);
    res.status(500).json({ error: 'Failed to fetch user' });
  }
});

// Update user role
router.patch('/:id/role', auth, requireRole(['ADMIN']), [
  body('role').isIn(['ADMIN', 'MODERATOR']),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { id } = req.params;
    const { role } = req.body;
    const { userId, username } = req.user;

    const user = await prisma.user.update({
      where: { id },
      data: { role },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
      },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'UPDATE_USER_ROLE',
        entityType: 'User',
        entityId: id,
        details: `Changed role to ${role}`,
        ipAddress: req.ip,
      },
    });

    logger.info(`User role updated: ${user.username} to ${role} by ${username}`);

    res.json({ user });
  } catch (error) {
    logger.error('Update user role error:', error);
    res.status(500).json({ error: 'Failed to update user role' });
  }
});

// Delete user
router.delete('/:id', auth, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { id } = req.params;
    const { userId, username } = req.user;

    if (id === userId) {
      return res.status(400).json({ error: 'Cannot delete yourself' });
    }

    const user = await prisma.user.delete({
      where: { id },
    });

    await prisma.auditLog.create({
      data: {
        userId,
        action: 'DELETE_USER',
        entityType: 'User',
        entityId: id,
        details: `Deleted user: ${user.username}`,
        ipAddress: req.ip,
      },
    });

    logger.info(`User deleted: ${user.username} by ${username}`);

    res.json({ success: true });
  } catch (error) {
    logger.error('Delete user error:', error);
    res.status(500).json({ error: 'Failed to delete user' });
  }
});

// Get user login history
router.get('/:id/login-history', auth, requireRole(['ADMIN']), async (req, res) => {
  try {
    const { page = 1, limit = 50 } = req.query;
    const skip = (page - 1) * limit;

    const [history, total] = await Promise.all([
      prisma.loginHistory.findMany({
        where: { userId: req.params.id },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' },
      }),
      prisma.loginHistory.count({ where: { userId: req.params.id } }),
    ]);

    res.json({
      history,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    logger.error('Get login history error:', error);
    res.status(500).json({ error: 'Failed to fetch login history' });
  }
});

module.exports = router;
