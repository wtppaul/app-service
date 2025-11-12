// File: src/services/tag.service.ts
import { prisma } from '../utils/prisma';

export const updateCourseTagsBySlug = async (id: string, tagIds: string[]) => {
  const course = await prisma.course.findUnique({ where: { id } });
  if (!course) throw new Error('Course not found');

  return prisma.course.update({
    where: { id: course.id },
    data: {
      tags: {
        set: [],
        connect: tagIds.map((id) => ({ id })),
      },
    },
    include: { tags: true },
  });
};
