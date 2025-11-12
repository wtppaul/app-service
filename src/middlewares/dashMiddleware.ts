// path: src/middlewares/authMiddleware.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from '../utils/jwt';
import jwt from 'jsonwebtoken';

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
    role: string;
    [key: string]: any;
  };
}

// ✅ Middleware dengan dukungan allowedRoles
export const dashMiddleware = (allowedRoles: string[] = []) => {
  return async (
    req: AuthenticatedRequest,
    reply: FastifyReply
  ): Promise<void> => {
    try {
      console.log(`🔄 dashMiddleware dipanggil untuk request: ${req.url}`);
      console.log('Cookies diterima:', req.cookies);

      const accessToken = req.cookies?.accessToken;
      if (!accessToken) {
        reply.code(401).send({ message: 'Unauthorized' });
        return;
      }

      const decodedAccessToken = verifyToken(accessToken);
      console.log('✅ Token decoded:', decodedAccessToken);

      const decoded = jwt.decode(accessToken, { complete: true });
      console.log('🔎 Full decoded token:', decoded);

      if (!decodedAccessToken || typeof decodedAccessToken !== 'object') {
        reply.code(401).send({ message: 'Invalid or expired token' });
        return;
      }

      if (
        allowedRoles.length &&
        !allowedRoles.includes(decodedAccessToken.role)
      ) {
        reply.code(403).send({ message: 'Forbidden: Role not allowed' });
        return;
      }

      req.user = decodedAccessToken;
      console.log('✅ Access token valid, REQUSER:', decodedAccessToken);
    } catch (error) {
      console.error('❌ AUTH ERROR (middleware crash):', error);
      reply.code(500).send({ message: 'Internal server error' });
    }
  };
};
