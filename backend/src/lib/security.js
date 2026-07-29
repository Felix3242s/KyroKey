const argon2 = require('argon2');
const crypto = require('crypto');

const hashPassword = async (password) => {
  return argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });
};

const verifyPassword = async (hash, password) => {
  return argon2.verify(hash, password);
};

const generateLicenseKey = () => {
  const segments = 4;
  const segmentLength = 5;
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  
  let key = 'KYRO-';
  for (let i = 0; i < segments; i++) {
    for (let j = 0; j < segmentLength; j++) {
      key += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    if (i < segments - 1) key += '-';
  }
  
  return key;
};

const generateApiKey = () => {
  return crypto.randomBytes(32).toString('hex');
};

const generateTwoFactorSecret = () => {
  return crypto.randomBytes(20).toString('base32');
};

const calculateExpiryDate = (duration) => {
  const now = new Date();
  
  switch (duration) {
    case 'DAY_1':
      return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    case 'DAY_3':
      return new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);
    case 'DAY_7':
      return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
    case 'DAY_30':
      return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000);
    case 'DAY_90':
      return new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    case 'LIFETIME':
      return null;
    default:
      return null;
  }
};

module.exports = {
  hashPassword,
  verifyPassword,
  generateLicenseKey,
  generateApiKey,
  generateTwoFactorSecret,
  calculateExpiryDate,
};
