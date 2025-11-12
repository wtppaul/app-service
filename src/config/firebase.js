require('dotenv').config();
const admin = require('firebase-admin');
const serviceAccount = require('../../serviceAccountKey.json'); // Menggunakan file JSON langsung

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: process.env.FIREBASE_STORAGE_BUCKET,
});

const bucket = admin.storage().bucket();

module.exports = { admin, bucket };
