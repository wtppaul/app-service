import { FastifyRequest, FastifyReply } from 'fastify';
import { syncUserService } from '../services/user.service';

interface AuthenticatedRequest extends FastifyRequest {
  user?: {
    id: string;
    role: 'student' | 'teacher';
    username: string;
  };
}

export const syncUserController = async (
  req: AuthenticatedRequest,
  reply: FastifyReply
) => {
  try {
    const { id: authId, role, username } = req.user!;
    console.log('req ueserekl :: ', req.user);
    const result = await syncUserService.syncUser({
      authId,
      role,
      username,
    });

    return reply.send(result);
  } catch (error) {
    console.error('Error syncing user:', error);

    if (error instanceof Error && error.message === 'Invalid role') {
      return reply.status(400).send({
        success: false,
        message: 'Invalid role',
      });
    }

    return reply.status(500).send({
      success: false,
      message: 'Internal server error',
    });
  }
};
