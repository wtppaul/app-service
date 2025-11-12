// src/utils/auth.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { AuthPayload, verifyToken } from './jwt';

export const authenticate = async (
  req: FastifyRequest,
  reply: FastifyReply
): Promise<AuthPayload> => {
  const token = req.cookies?.accessToken;

  if (!token) {
    return reply.status(401).send({ message: 'Unauthorized: Missing token' });
  }

  try {
    const decoded = verifyToken(token) as AuthPayload;
    return decoded;
  } catch (err) {
    return reply.status(401).send({ message: 'Unauthorized: Invalid token' });
  }
};
