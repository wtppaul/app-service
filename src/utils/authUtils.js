const fs = require('fs');
const jwt = require('jsonwebtoken');
const config = require('../config/config');

const accessPublicKey = fs.readFileSync('./keys/access/public.key', 'utf8');

// ✅ Fungsi untuk memverifikasi accessToken
const verifyAccessToken = (token) => {
  try {
    return jwt.verify(token, accessPublicKey, {
      algorithms: ['RS256'],
    });
  } catch (error) {
    return { forceLogout: true };
  }
};

module.exports = {
  verifyAccessToken,
};
