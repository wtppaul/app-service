// src/utils/findUserByUsername.ts
import { prisma } from './prisma';

type UnifiedUser = {
  id: string;
  authId: string;
  username: string;
  name: string;
  role: 'teacher' | 'student';
};

export const findUserByUsername = async (
  username: string
): Promise<UnifiedUser | null> => {
  if (!username) return null; // ⛔ pastikan tidak undefined/null

  const teacher = await prisma.teacher.findUnique({
    where: { username },
  });
  console.log('USERNAME teacher:: ', teacher?.username);
  if (teacher) {
    return {
      id: teacher.id,
      authId: teacher.authId,
      username: teacher.username,
      name: teacher.name,
      role: 'teacher',
    };
  }

  const student = await prisma.student.findUnique({
    where: { username },
  });

  if (student) {
    return {
      id: student.id,
      authId: student.authId,
      username: student.username,
      name: student.name,
      role: 'student',
    };
  }

  return null;
};
