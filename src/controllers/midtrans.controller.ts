// src/controllers/midtrans.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { isSignatureValid } from '../utils/midtrans';
import { prisma } from '../utils/prisma';

export const midtransWebhookController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const {
      order_id,
      status_code,
      gross_amount,
      signature_key,
      transaction_status,
    } = req.body as any;

    const isValid = isSignatureValid(
      order_id,
      status_code,
      gross_amount,
      signature_key
    );
    if (!isValid) {
      return reply.status(403).send({ message: 'Invalid signature' });
    }

    const transaction = await prisma.transaction.findUnique({
      where: { midtransOrderId: order_id },
    });
    if (!transaction)
      return reply.status(404).send({ message: 'Transaction not found' });

    await prisma.transaction.update({
      where: { midtransOrderId: order_id },
      data: { status: transaction_status },
    });

    if (transaction_status === 'settlement') {
      const cart = await prisma.cart.findUnique({
        where: { id: transaction.cartId },
        include: {
          items: true,
        },
      });

      for (const item of cart?.items ?? []) {
        await prisma.enrollment.upsert({
          where: {
            authId_courseId: {
              authId: transaction.userId,
              courseId: item.courseId,
            },
          },
          update: {},
          create: {
            authId: transaction.userId,
            userRole: 'STUDENT',
            courseId: item.courseId,
          },
        });
      }

      await prisma.cartItem.deleteMany({ where: { cartId: cart?.id } });
    }

    return reply.send({ message: 'Notification handled' });
  } catch (err) {
    console.error(err);
    return reply.status(500).send({ message: 'Webhook error' });
  }
};
