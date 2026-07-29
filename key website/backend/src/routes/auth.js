const express = require('express');
const jwt = require('jsonwebtoken');
const { body, validationResult } = require('express-validator');
const speakeasy = require('speakeasy');
const QRCode = require('qrcode');
const prisma = require('../lib/prisma');
const { hashPassword, verifyPassword, generateTwoFactorSecret } = require('../lib/security');
const { sendDiscordWebhook } = require('../lib/discord');
const logger = require('../lib/logger');

const router = express.Router();

// Register
router.post('/register', [
  body('email').isEmail().normalizeEmail(),
  body('username').isLength({ min: 3, max: 20 }).trim(),
  body('password').isLength({ min: 8 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, username, password } = req.body;

    const existingUser = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username }],
      },
    });

    if (existingUser) {
      return res.status(400).json({ error: 'Email or username already exists' });
    }

    const hashedPassword = await hashPassword(password);

    const user = await prisma.user.create({
      data: {
        email,
        username,
        password: hashedPassword,
        role: 'MODERATOR',
      },
      select: {
        id: true,
        email: true,
        username: true,
        role: true,
        createdAt: true,
      },
    });

    logger.info(`New user registered: ${username}`);

    res.status(201).json({ user });
  } catch (error) {
    logger.error('Registration error:', error);
    res.status(500).json({ error: 'Registration failed' });
  }
});

// Login
router.post('/login', [
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty(),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { email, password, twoFactorToken } = req.body;

    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      await prisma.loginHistory.create({
        data: {
          userId: '00000000-0000-0000-0000-000000000000',
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          success: false,
        },
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isValidPassword = await verifyPassword(user.password, password);
    if (!isValidPassword) {
      await prisma.loginHistory.create({
        data: {
          userId: user.id,
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
          success: false,
        },
      });
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    if (user.twoFactorEnabled) {
      if (!twoFactorToken) {
        return res.status(200).json({ requiresTwoFactor: true });
      }

      const verified = speakeasy.totp.verify({
        secret: user.twoFactorSecret,
        encoding: 'base32',
        token: twoFactorToken,
      });

      if (!verified) {
        return res.status(401).json({ error: 'Invalid 2FA token' });
      }
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    await prisma.user.update({
      where: { id: user.id },
      data: { lastLogin: new Date() },
    });

    await prisma.loginHistory.create({
      data: {
        userId: user.id,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
        success: true,
      },
    });

    if (user.role === 'ADMIN') {
      await sendDiscordWebhook('ADMIN_LOGIN', {
        username: user.username,
        ipAddress: req.ip,
        userAgent: req.get('user-agent'),
      });
    }

    logger.info(`User logged in: ${user.username}`);

    res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        username: user.username,
        role: user.role,
        twoFactorEnabled: user.twoFactorEnabled,
      },
    });
  } catch (error) {
    logger.error('Login error:', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

// Enable 2FA
router.post('/2fa/enable', async (req, res) => {
  try {
    const { userId } = req.user;
    
    const secret = generateTwoFactorSecret();
    const qrCodeUrl = speakeasy.otpauthURL({
      secret,
      label: `KYRO:${req.user.username}`,
      issuer: 'KYRO License System',
    });

    const qrCodeImage = await QRCode.toDataURL(qrCodeUrl);

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorSecret: secret },
    });

    res.json({ qrCode: qrCodeImage, secret });
  } catch (error) {
    logger.error('2FA enable error:', error);
    res.status(500).json({ error: 'Failed to enable 2FA' });
  }
});

// Verify and confirm 2FA
router.post('/2fa/verify', async (req, res) => {
  try {
    const { userId } = req.user;
    const { token } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user.twoFactorSecret) {
      return res.status(400).json({ error: '2FA not set up' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: { twoFactorEnabled: true },
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('2FA verify error:', error);
    res.status(500).json({ error: 'Failed to verify 2FA' });
  }
});

// Disable 2FA
router.post('/2fa/disable', async (req, res) => {
  try {
    const { userId } = req.user;
    const { token } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user.twoFactorSecret) {
      return res.status(400).json({ error: '2FA not enabled' });
    }

    const verified = speakeasy.totp.verify({
      secret: user.twoFactorSecret,
      encoding: 'base32',
      token,
    });

    if (!verified) {
      return res.status(400).json({ error: 'Invalid token' });
    }

    await prisma.user.update({
      where: { id: userId },
      data: {
        twoFactorEnabled: false,
        twoFactorSecret: null,
      },
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('2FA disable error:', error);
    res.status(500).json({ error: 'Failed to disable 2FA' });
  }
});

// Change password
router.post('/change-password', [
  body('currentPassword').notEmpty(),
  body('newPassword').isLength({ min: 8 }),
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    }

    const { userId } = req.user;
    const { currentPassword, newPassword } = req.body;

    const user = await prisma.user.findUnique({
      where: { id: userId },
    });

    const isValidPassword = await verifyPassword(user.password, currentPassword);
    if (!isValidPassword) {
      return res.status(400).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = await hashPassword(newPassword);

    await prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    res.json({ success: true });
  } catch (error) {
    logger.error('Password change error:', error);
    res.status(500).json({ error: 'Failed to change password' });
  }
});

module.exports = router;
