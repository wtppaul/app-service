// src/controllers/checkout.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import snap from '../utils/midtransClient';
import { prisma } from '../utils/prisma';
import {
  findOrCreateCartService,
  getCartItemsService,
} from '../services/cart.service';

export const checkoutController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const userId = (req as any).user.id;
    const cart = await findOrCreateCartService(userId);
    const items = await getCartItemsService(userId);

    if (!items.length)
      return reply.status(400).send({ message: 'Cart is empty' });

    const grossAmount = items.reduce(
      (total, item) => total + item.course.price,
      0
    );

    const orderId = `esta-co-${Date.now()}-${Math.floor(Math.random() * 1000)}`;

    const transaction = await prisma.transaction.create({
      data: {
        userId,
        midtransOrderId: orderId,
        status: 'pending',
        totalAmount: grossAmount,
        cartId: cart.id,
      },
    });

    const parameter = {
      transaction_details: {
        order_id: orderId,
        gross_amount: grossAmount,
      },
      credit_card: {
        secure: true,
      },
      customer_details: {
        user_id: userId,
      },
    };

    const snapResponse = await snap.createTransaction(parameter);

    return reply.send({
      token: snapResponse.token,
      redirect_url: snapResponse.redirect_url,
    });
  } catch (err) {
    console.error(err);
    return reply
      .status(500)
      .send({ message: 'Failed to create checkout session' });
  }
};
