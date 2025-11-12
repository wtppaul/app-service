// src/services/wishlist.service.ts
import { PrismaClient } from '../../generated/prisma';

const prisma = new PrismaClient();

export const wishlistService = {
  async addToWishlist(authId: string, userRole: string, courseId: string) {
    const validRoles = ['STUDENT', 'TEACHER'];
    const normalizedRole = userRole.toUpperCase();

    if (!validRoles.includes(normalizedRole)) {
      throw new Error(`Invalid user role: ${userRole}`);
    }

    return prisma.wishlist.create({
      data: {
        authId,
        userRole: normalizedRole as 'STUDENT' | 'TEACHER',
        courseId,
      },
    });
  },

  async removeFromWishlist(authId: string, courseId: string) {
    return prisma.wishlist.delete({
      where: {
        authId_courseId: { authId, courseId },
      },
    });
  },

  async getWishlistCountByCourse(courseId: string) {
    return prisma.wishlist.count({
      where: { courseId },
    });
  },

  async getUserWishlist(authId: string) {
    return prisma.wishlist.findMany({
      where: { authId },
      include: { course: true },
      orderBy: { createdAt: 'desc' },
    });
  },

  async isInWishlist(authId: string, courseId: string) {
    return prisma.wishlist.findUnique({
      where: {
        authId_courseId: { authId, courseId },
      },
    });
  },
};
