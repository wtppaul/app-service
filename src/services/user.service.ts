import { prisma } from '../utils/prisma';

interface UserData {
  authId: string;
  role: 'student' | 'teacher';
  username: string;
}

export const syncUserService = {
  async syncUser(userData: UserData) {
    const { authId, role, username } = userData;

    if (role === 'teacher') {
      let teacher = await prisma.teacher.findUnique({
        where: { authId },
      });

      if (!teacher) {
        teacher = await prisma.teacher.create({
          data: {
            authId,
            username,
            name: username,
            bio: null,
          },
        });
      }

      return {
        success: true,
        user: teacher,
        role: 'teacher',
      };
    } else if (role === 'student') {
      let student = await prisma.student.findUnique({
        where: { authId },
      });

      if (!student) {
        student = await prisma.student.create({
          data: {
            authId,
            username,
            name: username,
          },
        });
      }

      return {
        success: true,
        user: student,
        role: 'student',
      };
    }

    throw new Error('Invalid role');
  },
};
