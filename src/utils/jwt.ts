// src/utils/jwt.ts
import jwt from 'jsonwebtoken';
import fs from 'fs';
import path from 'path';

const publicKey = fs.readFileSync(
  path.join(__dirname, '../../keys/public.key'),
  'utf8'
);

export interface AuthPayload {
  id: string;
  role: 'student' | 'teacher' | 'admin' | 'curator' | 'moderator';
  username: string;
}

export const verifyToken = (token: string): AuthPayload | null => {
  try {
    return jwt.verify(token, publicKey, {
      algorithms: ['RS256'],
    }) as AuthPayload;
  } catch {
    return null;
  }
};
