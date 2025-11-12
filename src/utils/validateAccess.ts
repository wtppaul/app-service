import { prisma } from './prisma';
import { verifyToken } from './jwt';

export const validateCourseOwnership = async (
  authId: string,
  courseId: string,
  role: string
) => {
  // Admin selalu bisa akses
  if (role === 'admin') return true;

  const teacher = await prisma.teacher.findUnique({
    where: { authId }, // cari teacher berdasarkan authId dari token
  });

  if (!teacher) return false;

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) return false;
  return course.teacherId === teacher.id;
};

export const validateUserEnrollment = async (
  authId: string,
  courseId: string
) => {
  const enrolled = await prisma.enrollment.findUnique({
    where: {
      authId_courseId: {
        authId,
        courseId,
      },
    },
  });
  return !!enrolled;
};
