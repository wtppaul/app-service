// path: src/middlewares/authMiddleware.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../utils/jwt';

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
    role: string;
    [key: string]: any;
  };
}

// ✅ Middleware factory yang kompatibel dengan Fastify `preHandler`
export function dashMiddleware(allowedRoles: string[]) {
  return async function (req: AuthenticatedRequest, reply: FastifyReply) {
    try {
      const token = req.cookies?.accessToken;
      if (!token) {
        return reply
          .code(401)
          .send({ message: 'Unauthorized: No access token' });
      }

      const decoded = verifyToken(token);
      if (!decoded || typeof decoded !== 'object' || !decoded.role) {
        return reply.code(401).send({ message: 'Unauthorized: Invalid token' });
      }

      if (!allowedRoles.includes(decoded.role)) {
        return reply
          .code(403)
          .send({ message: 'Forbidden: Insufficient role' });
      }

      req.user = decoded;
    } catch (err) {
      console.error('❌ Middleware error:', err);
      return reply.code(500).send({ message: 'Internal server error' });
    }
  };
}
