require('dotenv').config();
/**
 * REMOTE DB
 */

/**const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    // Mengambil password dari variabel lingkungan
    const password = process.env.MONGODB_PASSWORD;
    // Meng-escape password
    const escapedPassword = encodeURIComponent(password);
    // Mengganti password dalam URI dengan yang sudah di-escape
    const uri = process.env.MONGODB_URI.replace('<password>', escapedPassword);

    await mongoose.connect(uri);
    console.log('✅ MongoDB Connected');
  } catch (error) {
    console.error('❌ MongoDB Connection Failed:', error);
    process.exit(1);
  }
}; */

/**
 * LOCAL ESTABASE
 */
const mongoose = require('mongoose');

const uri = 'mongodb://172.22.160.1:27017/dash';

const connectDB = async () => {
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to Dash');
  } catch (error) {
    console.error('❌ Connection error:', error);
  }
};

connectDB();

module.exports = connectDB;
