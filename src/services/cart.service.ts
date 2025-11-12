// src/services/cart.service.ts
import { prisma } from '../utils/prisma';

export const findOrCreateCart = async (userId: string) => {
  const cart = await prisma.cart.findFirst({ where: { userId } });
  if (cart) return cart;
  return prisma.cart.create({ data: { userId } });
};

export const addToCart = async (userId: string, courseId: string) => {
  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new Error('Course not found');

  const cart = await findOrCreateCart(userId);

  const existing = await prisma.cartItem.findUnique({
    where: {
      cartId_courseId: {
        cartId: cart.id,
        courseId,
      },
    },
  });

  if (existing) {
    await prisma.cartItem.update({
      where: {
        cartId_courseId: {
          cartId: cart.id,
          courseId,
        },
      },
      data: {
        createdAt: new Date(),
      },
    });
    return existing;
  }

  return prisma.cartItem.create({
    data: {
      cartId: cart.id,
      courseId,
    },
  });
};

export const getCartItems = async (userId: string) => {
  const cart = await prisma.cart.findFirst({
    where: { userId },
    include: {
      items: {
        include: {
          course: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      },
    },
  });
  return cart?.items ?? [];
};

export const removeFromCart = async (userId: string, courseId: string) => {
  const cart = await prisma.cart.findFirst({ where: { userId } });
  if (!cart) return;

  await prisma.cartItem.deleteMany({
    where: {
      cartId: cart.id,
      courseId,
    },
  });
};
