// src/routes/midtrans.route.ts
import { FastifyPluginAsync } from 'fastify';
import { midtransWebhookController } from '../controllers/midtrans.controller';

const midtransRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/webhook', midtransWebhookController);
};

export default midtransRoute;
