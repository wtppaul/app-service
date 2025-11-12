import { prisma } from '../utils/prisma';

export const getUserProfile = async (userId: string, userRole: Role) => {
  if (userRole === 'STUDENT') {
    return await prisma.student.findUnique({ where: { authId: userId } });
  } else if (userRole === 'TEACHER') {
    return await prisma.teacher.findUnique({ where: { authId: userId } });
  }
  return null;
};
