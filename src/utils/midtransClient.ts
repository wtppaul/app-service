// src/utils/midtransClient.ts
import midtransClient from 'midtrans-client';

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-dummykey',
  clientKey: process.env.MIDTRANS_CLIENT_KEY || 'SB-Mid-client-dummykey',
});

export default snap;
