require('dotenv').config();

module.exports = {
  PORT: process.env.PORT || 5000,
  MONGO_URI: process.env.MONGO_URI,

  BACKEND_AUTH_URL: process.env.BACKEND_AUTH_URL,

  // UID
  UID_SECRET: process.env.UID_SECRET,

  // CallBack - fingerprint
  FINGERPRINT_SECRET: process.env.FINGERPRINT_SECRET,
  FINGERPRINT_SECRET_2: process.env.FINGERPRINT_SECRET_2,
  CHAR_COUNTER: Number(process.env.CHAR_COUNTER),

  // Token JWT Modular
  JWT_SECRET_ACCESS: process.env.JWT_SECRET_ACCESS, // Untuk AccessToken
  JWT_SECRET_REFRESH: process.env.JWT_SECRET_REFRESH, // Untuk RefreshToken
  JWT_SECRET_VERIFY: process.env.JWT_SECRET_VERIFY, // Untuk Verifikasi Email

  // Expiry Token
  JWT_ACCESS_EXPIRES_IN: '15m', // AccessToken: 15 menit
  JWT_REFRESH_EXPIRES_IN: '30d', // RefreshToken: 30 hari (jika rememberMe)
  JWT_VERIFY_EXPIRES_IN: '24h', // Verifikasi Email: 24 jam

  // Max-Age untuk Cookie (detik, bukan milidetik!)
  JWT_ACCESS_MAX_AGE: 15 * 60, // 15 menit
  JWT_REFRESH_MAX_AGE: 30 * 24 * 60 * 60, // 30 hari (jika rememberMe)
  JWT_REFRESH_MAX_AGE_SHORT: 7 * 24 * 60 * 60, // 7 hari (tanpa rememberMe)

  // Cookie Options
  COOKIE_SECRET: process.env.COOKIE_SECRET,
  COOKIE_ENC_SECRET: process.env.COOKIE_ENC_SECRET,
  COOKIE_OPTIONS: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production' ? true : false,
    sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
    path: '/',
  },
};
