// file: generateKeyPair.ts
import { generateKeyPairSync } from 'crypto';
import fs from 'fs';
import { exportJWK } from 'jose';

// Generate RSA keypair
const { publicKey, privateKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
});

// Export as PEM with PKCS8 (public & private)
fs.writeFileSync(
  'private.pem',
  privateKey.export({ type: 'pkcs8', format: 'pem' })
);
fs.writeFileSync(
  'public.pem',
  publicKey.export({ type: 'spki', format: 'pem' })
); // SPKI = PKCS8 public

// Convert public key to JWK for Cloudflare
(async () => {
  const jwk = await exportJWK(publicKey);
  fs.writeFileSync('public.jwk.json', JSON.stringify(jwk, null, 2));
  console.log('✅ public.jwk.json ready for Cloudflare upload');
})();
