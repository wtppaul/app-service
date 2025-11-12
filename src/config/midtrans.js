const midtransClient = require('midtrans-client');

const midtrans = new midtransClient.Snap({
  isProduction: false, // ✅ Ubah ke true jika ingin menggunakan mode produksi
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY,
});

module.exports = midtrans;
