import { prisma } from '../utils/prisma';

export const createLesson = async (
  chapterId: string,
  title: string,
  playbackId: string,
  duration?: number,
  order?: number
) => {
  const count = await prisma.lesson.count({ where: { chapterId } });

  return prisma.lesson.create({
    data: {
      title,
      playbackId,
      duration,
      chapterId,
      order: order ?? count,
    },
  });
};

export const reorderLessons = async (
  chapterId: string,
  updates: { id: string; order: number }[]
) => {
  const tx = updates.map((lsn) =>
    prisma.lesson.update({
      where: { id: lsn.id, chapterId },
      data: { order: lsn.order },
    })
  );
  return prisma.$transaction(tx);
};
