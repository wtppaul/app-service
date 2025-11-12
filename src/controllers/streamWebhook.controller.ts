import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../utils/prisma';

// export const streamWebhookController = async (
//   req: FastifyRequest,
//   reply: FastifyReply
// ) => {
//   const secret = req.headers['cf-stream-webhook-signature'];
//   if (secret !== process.env.CF_STREAM_WEBHOOK_SECRET) {
//     return reply.status(403).send({ error: 'Unauthorized webhook' });
//   }

//   const payload = req.body as any;

//   const { playback, meta, duration } = payload;

//   if (!meta?.lessonId || !playback?.id) {
//     return reply.status(400).send({ error: 'Missing data' });
//   }

//   await prisma.lesson.update({
//     where: { id: meta.lessonId },
//     data: {
//       playbackId: playback.id,
//       duration: Math.round(duration),
//     },
//   });

//   return reply.send({ success: true });
// };
