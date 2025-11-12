// src/controllers/cart.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import {
  addToCart,
  getCartItems,
  removeFromCart,
} from '../services/cart.service';

export const addToCartController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { courseId } = req.body as { courseId: string };
    const userId = (req as any).user.id;

    await addToCart(userId, courseId);
    return reply
      .status(201)
      .send({ message: 'Course added to cart successfully' });
  } catch (err: any) {
    console.error(err);
    return reply
      .status(400)
      .send({ message: err.message || 'Failed to add to cart' });
  }
};

export const getCartController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const userId = (req as any).user.id;
    const items = await getCartItems(userId);
    return reply.send({ items });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({ message: 'Failed to fetch cart' });
  }
};

export const removeFromCartController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const userId = (req as any).user.id;
    const { courseId } = req.params as { courseId: string };

    await removeFromCart(userId, courseId);
    return reply.send({ message: 'Course removed from cart' });
  } catch (err) {
    console.error(err);
    return reply
      .status(500)
      .send({ message: 'Failed to remove course from cart' });
  }
};
