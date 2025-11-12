// src/utils/authorize.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from './jwt';

export const authorize = (allowedRoles: string[]) => {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    const token = req.cookies?.accessToken;

    if (!token) {
      return reply
        .status(401)
        .send({ message: 'Unauthorized: No token provided' });
    }

    const payload = verifyToken(token);

    if (!payload || !allowedRoles.includes(payload.role)) {
      return reply
        .status(401)
        .send({ message: 'Unauthorized: Invalid token or role' });
    }

    // Inject ke req.user biar bisa dipakai controller kalau perlu
    (req as any).user = payload;
  };
};
