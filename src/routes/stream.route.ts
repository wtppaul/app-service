import { FastifyInstance } from 'fastify';
import { getUploadUrlController } from '../controllers/stream.controller';
import { streamWebhookController } from '../controllers/stream.controller';
import { authorize } from '../utils/authorize';

export default async function streamRoute(fastify: FastifyInstance) {
  fastify.post('/upload-url', {
    preHandler: [authorize(['teacher', 'admin'])],
    handler: getUploadUrlController,
  });
  fastify.post('/webhook', streamWebhookController);
}
