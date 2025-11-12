// src/routes/checkout.route.ts
import { FastifyPluginAsync } from 'fastify';
import { authorize } from '../utils/authorize';
import { authenticate } from '../utils/authenticate';
import { checkoutController } from '../controllers/checkout.controller';

const checkoutRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    '/',
    { preHandler: authorize(['student', 'teacher']) },
    checkoutController
  );
};

export default checkoutRoute;
