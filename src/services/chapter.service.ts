import { prisma } from '../utils/prisma';
import { z } from 'zod';
import { generateChapterSlug } from '../utils/slug';
import { nanoid } from 'nanoid';
import { Prisma } from '../../generated/prisma';

type NewLesson = {
  title: string;
  playbackId: string;
  order: number;
  duration?: number;
};

interface LessonInput {
  title: string;
  playbackId: string;
  order?: number;
  isPreview?: boolean;
}

const createChapterWithLessonsSchema = z.object({
  chapterId: z.string().optional(), // ✅ tambahkan ini
  rawTitle: z.string().min(1),
  order: z.number().optional(),
  lessons: z
    .array(
      z.object({
        title: z.string(),
        playbackId: z.string(),
        duration: z.number().optional(),
        order: z.number().optional(),
        isPreview: z.boolean().optional(),
      })
    )
    .optional(),
});

export const createChapterWithLessonsService2BCKPori = async (
  courseId: string,
  rawTitle?: string,
  order?: number,
  lessons?: NewLesson[],
  chapterId?: string
) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { slug: true },
  });
  console.log('agsh :: ', rawTitle);
  if (!course) {
    throw new Error('Course not found');
  }

  const count = await prisma.chapter.count({ where: { courseId } });
  const chapterNumber = count;

  // Slug auto dengan nomor + random string
  const randomSuffix = nanoid(4).toLowerCase();
  const slug = `${course.slug}-chapter-${chapterNumber}-${randomSuffix}`;

  const finalTitle = `Chapter ${chapterNumber}: ${rawTitle}`;
  console.log('ert :: ', finalTitle);
  // 1. Cari chapter berdasarkan courseId + order
  let chapter = await prisma.chapter.findFirst({
    where: {
      courseId,
      order: chapterNumber - 1,
    },
  });
  console.log('lastChapter :: ', chapter?.id);
  console.log('firstOrder2 :: ', count);
  if (chapter) {
    // ✅ Sudah ada, hanya update title
    chapter = await prisma.chapter.update({
      where: { id: chapter.id },
      data: { title: finalTitle },
    });
  } else {
    // ❌ Belum ada, buat baru
    chapter = await prisma.chapter.create({
      data: {
        title: finalTitle,
        slug,
        courseId,
        order: count + 1,
        lessons: lessons?.length
          ? {
              create: lessons.map((l) => ({
                title: l.title,
                playbackId: l.playbackId,
                duration: l.duration,
                order: l.order,
              })),
            }
          : undefined,
      },
      include: {
        lessons: true,
      },
    });
  }

  // 2. Tangani lessons
  if (lessons && lessons.length > 0) {
    for (const lesson of lessons) {
      const existing = await prisma.lesson.findFirst({
        where: {
          playbackId: lesson.playbackId,
          chapterId: chapter.id, // ✅ lebih ketat
        },
      });
      // For eliminating empty lesson
      const emptyLesson = await prisma.lesson.findFirst({
        where: {
          playbackId: '',
          title: '',
          chapterId: chapter.id,
        },
      });

      if (existing) {
        await prisma.lesson.update({
          where: { id: existing.id },
          data: {
            title: lesson.title,
            order: lesson.order ?? 0,
            chapterId: chapter.id, // ⬅ pindahkan kalau chapter beda
          },
        });
      } else {
        await prisma.lesson.create({
          data: {
            title: lesson.title,
            playbackId: lesson.playbackId,
            duration: 0,
            order: lesson.order ?? 0,
            chapterId: chapter.id,
          },
        });
        if (emptyLesson) {
          await prisma.lesson.delete({
            where: { id: emptyLesson?.id },
          });
        }
      }
    }
  }

  return chapter;
};

export const createChapterWithLessonsService = async (
  courseId: string,
  rawTitle?: string,
  order?: number,
  lessons?: NewLesson[],
  chapterId?: string
) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { slug: true },
  });
  if (!course) throw new Error('Course not found');

  let chapter: any;
  console.log('CHAPTERID ::: ', chapterId);
  if (chapterId) {
    // ✅ Update chapter langsung
    chapter = await prisma.chapter.update({
      where: { id: chapterId },
      data: { title: rawTitle },
    });
  } else {
    // ❌ Buat chapter baru
    const count = await prisma.chapter.count({ where: { courseId } });
    const chapterNumber = count + 1;
    const randomSuffix = nanoid(4).toLowerCase();
    const slug = `${course.slug}-chapter-${chapterNumber}-${randomSuffix}`;
    chapter = await prisma.chapter.create({
      data: {
        title: `Chapter ${chapterNumber}: ${rawTitle}`,
        slug,
        courseId,
        order: chapterNumber - 1,
        lessons: lessons?.length
          ? {
              create: lessons.map((l) => ({
                title: l.title,
                playbackId: l.playbackId,
                duration: l.duration,
                order: l.order,
              })),
            }
          : undefined,
      },
      include: { lessons: true },
    });
  }

  // 🔁 Update or create each lesson
  // 2. Tangani lessons

  if (lessons && lessons.length > 0) {
    for (const lesson of lessons) {
      console.log('EXISTING pbid ::: ', lesson.playbackId);
      console.log('EXISTING ch id ::: ', chapterId);
      const existing = await prisma.lesson.findFirst({
        where: {
          playbackId: lesson.playbackId,
          chapterId: chapterId, // ✅ lebih ketat
        },
      });
      console.log('EXISTING ::: ', existing);
      if (existing) {
        await prisma.lesson.update({
          where: { id: existing.id },
          data: {
            title: lesson.title,
            // chapterId: chapterId, // ⬅ pindahkan kalau chapter beda
            order: lesson.order,
          },
        });
      } else {
        // CREATE NEW LESSON
        await prisma.lesson.create({
          data: {
            title: lesson.title,
            playbackId: lesson.playbackId,
            duration: 0,
            order: lesson.order ?? 0,
            chapterId: chapter.id,
          },
        });

        // For eliminating empty lesson
        const emptyLesson = await prisma.lesson.findFirst({
          where: {
            playbackId: '',
            title: '',
            chapterId: chapter.id,
          },
        });

        if (emptyLesson) {
          await prisma.lesson.delete({
            where: { id: emptyLesson?.id },
          });
        }
      }
    }
  }

  return chapter;
};

export const createChapterService = async (
  courseId: string,
  rawTitle?: string,
  order?: number,
  lessons?: NewLesson[]
) => {
  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { slug: true },
  });

  if (!course) {
    throw new Error('Course not found');
  }

  const count = await prisma.chapter.count({ where: { courseId } });

  // Gunakan `order` jika dikirim, kalau tidak pakai `count`
  // const finalOrder = typeof order === 'number' ? order : count;
  const finalOrder = count;

  // Judul chapter pakai finalOrder + 1 (untuk tampilannya)
  const chapterNumber = finalOrder + 1;

  // Slug auto dengan nomor + random string
  const randomSuffix = nanoid(4).toLowerCase();
  const slug = `${course.slug}-chapter-${chapterNumber}-${randomSuffix}`;

  const title = `Chapter ${chapterNumber}: ${rawTitle}`;

  return prisma.chapter.create({
    data: {
      title,
      slug,
      courseId,
      order: finalOrder,
      lessons: lessons?.length
        ? {
            create: lessons.map((l) => ({
              title: l.title,
              playbackId: l.playbackId,
              duration: l.duration,
              order: l.order,
            })),
          }
        : undefined,
    },
    include: {
      lessons: true,
    },
  });
};

export const updateChapterService = async ({
  courseId,
  chapterId,
  rawTitle,
  order,
}: {
  courseId: string;
  chapterId: string;
  rawTitle?: string;
  order?: number;
}) => {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: { course: { select: { slug: true } } },
  });

  if (!chapter || chapter.courseId !== courseId) {
    throw new Error('Chapter not found or course mismatch');
  }

  const updatedData: Partial<{
    title: string;
    slug: string;
    order: number;
  }> = {};

  // Update order jika dikirim
  if (typeof order === 'number') {
    updatedData.order = order;
  }

  // Update title & slug jika rawTitle dikirim
  if (rawTitle) {
    const chapterNumber =
      (typeof order === 'number' ? order : chapter.order) + 1;
    updatedData.title = `Chapter ${chapterNumber}: ${rawTitle}`;

    const randomSuffix = chapter.slug.split('-').pop() ?? '';
    updatedData.slug = `${chapter.course.slug}-chapter-${chapterNumber}-${randomSuffix}`;
  }

  const updated = await prisma.chapter.update({
    where: { id: chapterId },
    data: updatedData,
  });

  return updated;
};

export const reorderChaptersService = async (
  courseId: string,
  updates: { id: string; order: number }[]
) => {
  // Step 1: Validasi order tidak duplikat
  const seenOrders = new Set();
  for (const { order } of updates) {
    if (seenOrders.has(order)) {
      throw new Error(`Duplicate chapter order detected: ${order}`);
    }
    seenOrders.add(order);
  }

  // Step 2: Ambil semua chapter terkait
  const chapters = await prisma.chapter.findMany({
    where: { courseId },
    select: {
      id: true,
      title: true,
    },
  });

  const course = await prisma.course.findUnique({
    where: { id: courseId },
    select: { slug: true },
  });

  if (!course) throw new Error('Course not found');

  // Step 3: Map data untuk update
  const chapterMap = new Map(chapters.map((ch) => [ch.id, ch.title]));

  const tx = updates.map((ch) => {
    const oldTitle = chapterMap.get(ch.id);
    if (!oldTitle) throw new Error(`Chapter not found: ${ch.id}`);

    const rawTitle = oldTitle.replace(/^Chapter\s\d+:\s/i, '').trim();
    const newTitle = `Chapter ${ch.order + 1}: ${rawTitle}`;
    const newSlug = `${course.slug}-chapter-${ch.order + 1}-${nanoid(
      4
    ).toLowerCase()}`;

    return prisma.chapter.update({
      where: { id: ch.id, courseId },
      data: {
        order: ch.order,
        title: newTitle,
        slug: newSlug,
      },
    });
  });

  return prisma.$transaction(tx);
};

export const deleteChapterService = async (
  courseId: string,
  chapterId: string
) => {
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    select: { courseId: true },
  });

  if (!chapter || chapter.courseId !== courseId) {
    throw new Error('Chapter not found or does not belong to course');
  }

  // Hapus semua lesson di dalam chapter
  await prisma.lesson.deleteMany({
    where: { chapterId },
  });

  // Hapus chapternya
  await prisma.chapter.delete({
    where: { id: chapterId },
  });

  // Ambil ulang semua chapter dari course terkait, urutkan ulang
  const remainingChapters = await prisma.chapter.findMany({
    where: { courseId },
    orderBy: { order: 'asc' },
    select: { id: true },
  });

  // Susun ulang urutan berdasarkan index sekarang
  const updates = remainingChapters.map((ch, idx) => ({
    id: ch.id,
    order: idx,
  }));

  // Reorder sekaligus update slug & title
  await reorderChaptersService(courseId, updates);
};
