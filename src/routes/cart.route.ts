// src/routes/cart.route.ts
import { FastifyPluginAsync } from 'fastify';
import { authenticate } from '../utils/authenticate';
import { authorize } from '../utils/authorize';
import {
  addToCartController,
  getCartController,
  removeFromCartController,
} from '../controllers/cart.controller';

const cartRoute: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('onRequest', authenticate);

  fastify.post(
    '/add',
    { preHandler: [authorize(['student', 'teacher', 'admin'])] },
    addToCartController
  );

  fastify.get(
    '/',
    { preHandler: [authorize(['student', 'teacher'])] },
    getCartController
  );

  fastify.delete(
    '/:courseId',
    { preHandler: [authorize(['student', 'teacher'])] },
    removeFromCartController
  );
};

export default cartRoute;
