// src/services/notification.service.ts
import {
  PrismaClient,
  NotificationType,
  NotificationUrgency,
} from '../../generated/prisma';
const prisma = new PrismaClient();

export const notificationService = {
  async getUserNotifications(
    authId: string,
    filters?: {
      type?: string;
      unreadOnly?: boolean;
      limit?: number;
    }
  ) {
    const { type, unreadOnly, limit = 20 } = filters || {};

    let whereClause: any = { authId };

    if (unreadOnly) {
      whereClause.isRead = false;
    }

    if (type) {
      whereClause.type = type;
    }

    return prisma.notification.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  },

  async getUnreadCount(authId: string) {
    return prisma.notification.count({
      where: {
        authId,
        isRead: false,
      },
    });
  },

  async markAsRead(notificationId: string) {
    return prisma.notification.update({
      where: { id: notificationId },
      data: { isRead: true },
    });
  },

  async markAllAsRead(authId: string) {
    return prisma.notification.updateMany({
      where: {
        authId,
        isRead: false,
      },
      data: { isRead: true },
    });
  },

  async deleteNotification(notificationId: string) {
    return prisma.notification.delete({
      where: { id: notificationId },
    });
  },

  // Notifikasi like course
  async createCourseLikeNotification(courseId: string, actorId: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { teacher: true },
    });

    if (!course) throw new Error('Course not found');

    const actor = await this.getUserInfo(actorId);
    const actorName = actor?.name || 'Someone';

    return prisma.notification.create({
      data: {
        authId: course.teacher.authId,
        message: `${actorName} menyukai kursus Anda: "${course.title}"`,
        type: 'COURSE_LIKE' as NotificationType,
        courseId: course.id,
        actorId: actorId,
        urgency: 'NORMAL' as NotificationUrgency,
      },
    });
  },

  // Notifikasi review course
  async createCourseReviewNotification(
    courseId: string,
    reviewId: string,
    actorId: string
  ) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { teacher: true },
    });

    if (!course) throw new Error('Course not found');

    const actor = await this.getUserInfo(actorId);
    const actorName = actor?.name || 'Someone';

    return prisma.notification.create({
      data: {
        authId: course.teacher.authId,
        message: `${actorName} memberikan review pada kursus Anda: "${course.title}"`,
        type: 'COURSE_REVIEW' as NotificationType,
        courseId: course.id,
        actorId: actorId,
        relatedId: reviewId,
        urgency: 'NORMAL' as NotificationUrgency,
      },
    });
  },

  // Notifikasi enrollment baru
  async createEnrollmentNotification(
    courseId: string,
    enrollmentId: string,
    studentId: string
  ) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { teacher: true },
    });

    if (!course) throw new Error('Course not found');

    const student = await prisma.student.findUnique({
      where: { id: studentId },
    });

    const studentName = student?.name || 'Someone';

    return prisma.notification.create({
      data: {
        authId: course.teacher.authId,
        message: `${studentName} telah mendaftar ke kursus Anda: "${course.title}"`,
        type: 'NEW_ENROLLMENT' as NotificationType,
        courseId: course.id,
        actorId: studentId,
        relatedId: enrollmentId,
        urgency: 'NORMAL' as NotificationUrgency,
      },
    });
  },

  // Notifikasi course published
  async createCoursePublishedNotification(courseId: string) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: { teacher: true },
    });

    if (!course) throw new Error('Course not found');

    return prisma.notification.create({
      data: {
        authId: course.teacher.authId,
        message: `Kursus Anda "${course.title}" telah berhasil dipublikasikan!`,
        type: 'COURSE_PUBLISHED' as NotificationType,
        courseId: course.id,
        urgency: 'HIGH' as NotificationUrgency,
      },
    });
  },

  // Notifikasi pembayaran berhasil
  async createPaymentSuccessNotification(
    authId: string,
    courseId: string,
    amount: number
  ) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
    });

    const courseTitle = course?.title || 'kursus';

    return prisma.notification.create({
      data: {
        authId: authId,
        message: `Pembayaran untuk "${courseTitle}" berhasil! Amount: Rp ${amount.toLocaleString(
          'id-ID'
        )}`,
        type: 'PAYMENT_SUCCESS' as NotificationType,
        courseId: courseId,
        urgency: 'HIGH' as NotificationUrgency,
      },
    });
  },

  // Notifikasi sistem
  async createSystemNotification(
    authId: string,
    message: string,
    urgency: NotificationUrgency = 'NORMAL'
  ) {
    return prisma.notification.create({
      data: {
        authId: authId,
        message: message,
        type: 'SYSTEM_ANNOUNCEMENT' as NotificationType,
        urgency: urgency,
      },
    });
  },

  // Helper function untuk mendapatkan info user
  async getUserInfo(authId: string) {
    const teacher = await prisma.teacher.findUnique({
      where: { authId },
      select: { name: true },
    });

    if (teacher) return teacher;

    const student = await prisma.student.findUnique({
      where: { authId },
      select: { name: true },
    });

    return student;
  },
};
