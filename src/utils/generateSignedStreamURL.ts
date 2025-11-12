// utils/generateSignedStreamURL.ts
import { createPrivateKey, sign, constants } from 'crypto';

const CF_STREAM__KID = process.env.CF_STREAM_SIGNING_KEY_ID!;
const CF_ACCOUNT_HASH = process.env.CF_ACCOUNT_HASH!;
const CF_PVT_SIGNING_JWK = process.env.CF_STREAM_SIGNING_PRIVATE_KEY!; // base64 encoded JWK JSON

function signJWT(
  playbackId: string,
  options?: { wildcard?: boolean; expiryInSeconds?: number }
): string {
  const useWildcard = options?.wildcard ?? false;
  const expiryInSeconds = options?.expiryInSeconds ?? 3600;
  const unixExpiry = Math.floor(Date.now() / 1000) + expiryInSeconds;

  const header = {
    alg: 'RS256',
    typ: 'JWT',
    kid: CF_STREAM__KID,
  };

  const payload = {
    sub: useWildcard ? `${playbackId}/*` : playbackId,
    kid: CF_STREAM__KID,
    exp: unixExpiry,
    aud: 'stream',
  };

  const encode = (obj: any) =>
    Buffer.from(JSON.stringify(obj)).toString('base64url');

  const jwtHeader = encode(header);
  const jwtPayload = encode(payload);
  const data = `${jwtHeader}.${jwtPayload}`;

  const jwk = JSON.parse(
    Buffer.from(CF_PVT_SIGNING_JWK, 'base64').toString('utf8')
  );
  const keyObject = createPrivateKey({ key: jwk, format: 'jwk' });

  const signature = sign('RSA-SHA256', Buffer.from(data), {
    key: keyObject,
    padding: constants.RSA_PKCS1_PADDING,
  }).toString('base64url');

  return `${data}.${signature}`;
}

export function generateIframeStreamURL(
  playbackId: string,
  expiryInSeconds = 3600
): string {
  const token = signJWT(playbackId, { wildcard: false, expiryInSeconds });
  return `https://iframe.videodelivery.net/${playbackId}?token=${token}`;
}

export function generateHlsStreamURL(
  playbackId: string,
  expiryInSeconds = 3600
): string {
  const token = signJWT(playbackId, { wildcard: false, expiryInSeconds });
  return `https://customer-${CF_ACCOUNT_HASH}.cloudflarestream.com/${playbackId}/manifest/video.m3u8?token=${token}`;
}

export function generateDashStreamURL(
  playbackId: string,
  expiryInSeconds = 3600
): string {
  const token = signJWT(playbackId, { wildcard: true, expiryInSeconds });
  return `https://customer-${CF_ACCOUNT_HASH}.cloudflarestream.com/${playbackId}/manifest/video.mpd?token=${token}`;
}

export function generateThumbnailURL(
  playbackId: string,
  height = 240,
  expiryInSeconds = 3600
): string {
  const token = signJWT(playbackId, { wildcard: true, expiryInSeconds });
  return `https://customer-${CF_ACCOUNT_HASH}.cloudflarestream.com/${playbackId}/thumbnails/thumbnail.jpg?height=${height}&token=${token}`;
}
