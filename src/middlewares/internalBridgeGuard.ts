// src/middleware/internalBridgeGuard.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import sanitizeInput from '../utils/xInputSanitize';

const internalHeaderSchema = z.object({
  'x-internal-bridge': z.literal('admin_service'),
  'x-access-token': z.string().min(20), // bisa disesuaikan
});

export const internalBridgeGuard = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const cleanHeaders = sanitizeInput(internalHeaderSchema.parse(req.headers));
    const parsed = cleanHeaders;

    const validToken =
      parsed['x-access-token'] === process.env.INTERNAL_SECRET_TOKEN;

    if (!validToken) {
      return reply
        .status(401)
        .send({ message: 'Invalid internal access token.' });
    }

    (req as any).user = {
      id: 'internal-admin',
      role: 'admin',
      source: 'internalBridge',
    };

    return; // passed
  } catch (err) {
    return reply
      .status(403)
      .send({ message: 'Forbidden: Internal bridge required.' });
  }
};
