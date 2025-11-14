import axios, { AxiosInstance } from 'axios';
import { prisma } from '../utils/prisma';
import { z } from 'zod';
import { generateChapterSlug } from '../utils/slug';
import { nanoid } from 'nanoid';
import { Prisma } from '../../generated/prisma';
import { Chapter } from '../../generated/prisma';

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

export const reorderChaptersSchema = z.array(
  z.object({
    id: z.string().uuid(),
    order: z.number().int(),
  })
);
type ReorderChaptersInput = z.infer<typeof reorderChaptersSchema>;

interface CreateChapterInput {
  title: string;
  order: number;
}
// (Kita definisikan skema Zod di sini untuk validasi input service)
export const updateChapterSchema = z.object({
  title: z.string().min(8).optional(),
  order: z.number().int().optional(),
});

// Buat Tipe TypeScript dari skema Zod
type UpdateChapterInput = z.infer<typeof updateChapterSchema>;

// Tipe output (sesuai struct 'Chapter' di Go)
// (Kita bisa menggunakan tipe 'Chapter' dari Prisma jika cocok)
type ChapterFromGo = Chapter;

const COURSE_SERVICE_URL =
  process.env.COURSE_SERVICE_URL || 'http://course-service:8083';
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET;

const apiClient: AxiosInstance = axios.create({
  baseURL: COURSE_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Secret': INTERNAL_SECRET,
  },
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

// ✅
export const createChapterService = async (
  courseId: string,
  data: CreateChapterInput,
  authId: string // "Paspor"
): Promise<ChapterFromGo> => {
  try {
    // Panggil endpoint Go yang baru saja Anda buat
    const response = await apiClient.post<ChapterFromGo>(
      `/internal/courses/${courseId}/chapters`, // POST /internal/courses/:courseId/chapters
      data, // { "title": "...", "order": ... }
      {
        headers: {
          // Kirim "Paspor" agar handler Go bisa menerimanya
          'X-Authenticated-User-ID': authId,
        },
      }
    );
    return response.data;
  } catch (err: unknown) {
    // Error handling yang aman
    if (axios.isAxiosError(err)) {
      console.error(
        'Error in createChapterService (BFF):',
        err.response?.data || err.message
      );
      if (err.response?.status === 403) {
        throw new Error('Forbidden: You do not own this course');
      }
      if (err.response?.status === 404) {
        throw new Error('Course not found');
      }
      const message = err.response?.data?.error || 'Failed to create chapter';
      throw new Error(message);
    } else if (err instanceof Error) {
      console.error('Error in createChapterService (BFF):', err.message);
      throw new Error(err.message);
    } else {
      console.error('Unknown error in createChapterService (BFF):', err);
      throw new Error('An unknown error occurred');
    }
  }
};

// ✅
export const updateChapterService = async (
  courseId: string,
  chapterId: string,
  data: UpdateChapterInput, // Menggunakan tipe Zod
  authId: string // "Paspor"
): Promise<ChapterFromGo> => {
  try {
    // Panggil endpoint Go yang baru saja Anda buat
    const response = await apiClient.patch<ChapterFromGo>(
      `/internal/courses/${courseId}/chapters/${chapterId}`, // PATCH /internal/courses/:courseId/chapters/:chapterId
      data, // { "title": "...", "order": ... } (hanya field yang ada)
      {
        headers: {
          'X-Authenticated-User-ID': authId,
        },
      }
    );
    return response.data;
  } catch (err: unknown) {
    // Error handling yang aman
    if (axios.isAxiosError(err)) {
      console.error(
        'Error in updateChapterService (BFF):',
        err.response?.data || err.message
      );
      if (err.response?.status === 403) {
        throw new Error('Forbidden: You do not own this course');
      }
      if (err.response?.status === 404) {
        throw new Error('Chapter or Course not found');
      }
      const message = err.response?.data?.error || 'Failed to update chapter';
      throw new Error(message);
    } else if (err instanceof Error) {
      console.error('Error in updateChapterService (BFF):', err.message);
      throw new Error(err.message);
    } else {
      console.error('Unknown error in updateChapterService (BFF):', err);
      throw new Error('An unknown error occurred');
    }
  }
};


/**
 * ✅ 
 * Memanggil course-service (Go) untuk reorder semua Chapter
 */
export const reorderChaptersService = async (
  courseId: string,
  data: ReorderChaptersInput, // Menggunakan tipe array Zod
  authId: string // "Paspor"
): Promise<{ message: string }> => {
  try {
    // Panggil endpoint Go yang baru saja Anda buat
    const response = await apiClient.post<{ message: string }>(
      `/internal/courses/${courseId}/chapters/reorder`, // POST /internal/courses/:courseId/chapters/reorder
      data, // [ { "id": "uuid", "order": 1 }, ... ]
      {
        headers: {
          'X-Authenticated-User-ID': authId,
        },
      }
    );
    return response.data; // { "message": "..." }
  } catch (err: unknown) {
    // Error handling yang aman
    if (axios.isAxiosError(err)) {
      console.error(
        'Error in reorderChaptersService (BFF):',
        err.response?.data || err.message
      );
      if (err.response?.status === 403) {
        throw new Error('Forbidden: You do not own this course');
      }
      if (err.response?.status === 404) {
        throw new Error('Course not found');
      }
      // Error 400 dari Go berarti salah satu ID chapter tidak valid
      if (err.response?.status === 400) {
        throw new Error(err.response.data.error || 'Reorder failed: Invalid chapter data');
      }
      const message = err.response?.data?.error || 'Failed to reorder chapters';
      throw new Error(message);
    } else if (err instanceof Error) {
      console.error('Error in reorderChaptersService (BFF):', err.message);
      throw new Error(err.message);
    } else {
      console.error('Unknown error in reorderChaptersService (BFF):', err);
      throw new Error('An unknown error occurred');
    }
  }
};

/**
 * ✅ 
 * Memanggil course-service (Go) untuk menghapus Chapter
 */
export const deleteChapterService = async (
  courseId: string,
  chapterId: string,
  authId: string // "Paspor"
): Promise<{ message: string }> => {
  try {
    // Panggil endpoint Go yang baru saja Anda buat
    const response = await apiClient.delete<{ message: string }>(
      `/internal/courses/${courseId}/chapters/${chapterId}`, // DELETE /internal/courses/:courseId/chapters/:chapterId
      {
        headers: {
          'X-Authenticated-User-ID': authId,
        },
      }
    );
    return response.data; // { "message": "..." }
  } catch (err: unknown) {
    // Error handling yang aman
    if (axios.isAxiosError(err)) {
      console.error(
        'Error in deleteChapterService (BFF):',
        err.response?.data || err.message
      );
      if (err.response?.status === 403) {
        throw new Error('Forbidden: You do not own this course');
      }
      if (err.response?.status === 404) {
        // Ini bisa berarti Course atau Chapter tidak ditemukan
        throw new Error(err.response.data.error || 'Chapter not found or does not belong to this course');
      }
      const message = err.response?.data?.error || 'Failed to delete chapter';
      throw new Error(message);
    } else if (err instanceof Error) {
      console.error('Error in deleteChapterService (BFF):', err.message);
      throw new Error(err.message);
    } else {
      console.error('Unknown error in deleteChapterService (BFF):', err);
      throw new Error('An unknown error occurred');
    }
  }
};