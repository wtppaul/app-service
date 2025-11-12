// utils/cloudflare.ts
import crypto from 'crypto';
import fs from 'fs';

const CF_PVT_SIGNING_KEY = fs.readFileSync(
  './keys/cf_stream_private.pem',
  'utf8'
);
const CF_STREAM_SIGNING_KEY_ID = process.env.CF_STREAM_SIGNING_KEY_ID!;

export const generateSignedStreamURL = (
  playbackId: string,
  expiryInSeconds: number = 3600
): string => {
  const baseUrl = `https://videodelivery.net/${playbackId}/manifest/video.m3u8`;
  const unixExpiry = Math.floor(Date.now() / 1000) + expiryInSeconds;

  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: CF_STREAM_SIGNING_KEY_ID,
  };

  const payload = {
    sub: playbackId,
    exp: unixExpiry,
    kid: CF_STREAM_SIGNING_KEY_ID, // <- INI WAJIB ADA!
    aud: 'stream', // <- Penting!
  };

  const encode = (obj: any) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');

  const jwtHeader = encode(header);
  const jwtPayload = encode(payload);
  const data = `${jwtHeader}.${jwtPayload}`;

  const privateKey = CF_PVT_SIGNING_KEY; // If stored in .env

  const signature = crypto
    .sign('RSA-SHA256', Buffer.from(data), {
      key: privateKey,
      padding: crypto.constants.RSA_PKCS1_PADDING,
    })
    .toString('base64url');

  const token = `${data}.${signature}`;

  return `${baseUrl}?token=${token}`;
};
