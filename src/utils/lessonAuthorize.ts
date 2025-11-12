// src/utils/authorize.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { verifyToken } from './jwt';
import { prisma } from '../utils/prisma';

export const lessonAuthorize = (
  allowedRoles: string[],
  options?: { allowPreview?: boolean }
) => {
  return async (req: FastifyRequest, reply: FastifyReply) => {
    // Jika allowPreview diaktifkan, cek dulu apakah lesson adalah preview
    if (options?.allowPreview) {
      const { lessonId } = req.params as { lessonId: string };
      const lesson = await prisma.lesson.findUnique({
        where: { id: lessonId },
        select: { isPreview: true },
      });

      if (lesson?.isPreview) {
        // Bypass authorization untuk preview lesson
        return;
      }
    }

    // Lanjut dengan authorization normal
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

    (req as any).user = payload;
  };
};
