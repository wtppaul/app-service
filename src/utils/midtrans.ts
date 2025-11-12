// src/utils/midtrans.ts
import crypto from 'crypto';

export function isSignatureValid(
  orderId: string,
  statusCode: string,
  grossAmount: string,
  receivedSignature: string
): boolean {
  const serverKey = process.env.MIDTRANS_SERVER_KEY || 'SB-Mid-server-dummykey';

  const payload = orderId + statusCode + grossAmount + serverKey;
  const hash = crypto.createHash('sha512').update(payload).digest('hex');

  return hash === receivedSignature;
}
