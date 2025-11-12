// src/services/wishlist.service.ts
import { PrismaClient } from '../../generated/prisma';
import { notificationService } from './notification.service';

const prisma = new PrismaClient();

export const loveService = {
  // Love Course
  async addLoveToCourse(authId: string, userRole: string, courseId: string) {
    // Validasi dan konversi role
    const validRoles = ['STUDENT', 'TEACHER'];
    const normalizedRole = userRole.toUpperCase();

    if (!validRoles.includes(normalizedRole)) {
      throw new Error(`Invalid user role: ${userRole}`);
    }

    // Cek apakah sudah like sebelumnya
    const existingLike = await prisma.courseLove.findUnique({
      where: {
        authId_courseId: { authId, courseId },
      },
    });

    if (existingLike) {
      throw new Error('Course already liked by this user');
    }

    // Buat like
    const courseLove = await prisma.courseLove.create({
      data: {
        authId,
        userRole: normalizedRole as 'STUDENT' | 'TEACHER',
        courseId,
      },
    });

    // Buat notifikasi (jika yang like bukan pemilik course)
    try {
      const course = await prisma.course.findUnique({
        where: { id: courseId },
        select: { teacherId: true },
      });

      // if (course && course.teacherId === authId)
      if (course && course.teacherId) {
        await notificationService.createCourseLikeNotification(
          courseId,
          authId
        );
      }
    } catch (error) {
      // Jangan gagalkan operasi like jika notifikasi gagal
      console.error('Failed to create notification:', error);
    }

    return courseLove;
  },

  async removeLoveFromCourse(authId: string, courseId: string) {
    return prisma.courseLove.delete({
      where: {
        authId_courseId: { authId, courseId },
      },
    });
  },

  // async getCourseLoves(courseId: string) {
  //   return prisma.courseLove.findMany({
  //     where: { courseId },
  //     include: { course: true },
  //     orderBy: { createdAt: 'desc' },
  //   });
  // },

  async getCourseLovesCount(courseId: string) {
    return prisma.courseLove.count({
      where: { courseId },
    });
  },

  async isCourseLovedByUser(authId: string, courseId: string) {
    return prisma.courseLove.findUnique({
      where: {
        authId_courseId: { authId, courseId },
      },
    });
  },

  // Love User
  async addLoveToUser(authId: string, userRole: string, lovedUserId: string) {
    return prisma.userLove.create({
      data: {
        authId,
        userRole: userRole as 'STUDENT' | 'TEACHER',
        lovedUserId,
      },
    });
  },

  async removeLoveFromUser(authId: string, lovedUserId: string) {
    return prisma.userLove.delete({
      where: {
        authId_lovedUserId: { authId, lovedUserId },
      },
    });
  },

  async getUserLoves(lovedUserId: string) {
    return prisma.userLove.findMany({
      where: { lovedUserId },
      orderBy: { createdAt: 'desc' },
    });
  },

  async isUserLovedByUser(authId: string, lovedUserId: string) {
    return prisma.userLove.findUnique({
      where: {
        authId_lovedUserId: { authId, lovedUserId },
      },
    });
  },
};
