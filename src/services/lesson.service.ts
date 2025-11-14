import axios, { AxiosInstance } from 'axios';
import { Lesson, CourseStatus as EnumCourseStatus, CourseLevel, CourseLicense } from '../../generated/prisma';
import { z } from 'zod';
import { prisma } from '../utils/prisma';

// --- 1. KLIEN API INTERNAL KITA ---
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

// Skema Zod untuk input 'create'
export const createLessonSchema = z.object({
  title: z.string().min(1),
  // playbackId: z.string().min(1),
  order: z.number(), // wajib biar Prisma nggak error
  // duration: z.number().optional(),
  // isPreview: z.boolean().optional(),
});

type CreateLessonInput = z.infer<typeof createLessonSchema>;

// Perhatikan: TIDAK ADA playbackId atau duration di sini.
export const updateLessonSchema = z.object({
  title: z.string().min(8, 'Title must be at least 8 characters long').optional(),
  order: z.number().int().optional(),
  isPreview: z.boolean().optional(),
});
type UpdateLessonInput = z.infer<typeof updateLessonSchema>;
// Tipe output (sesuai struct 'Lesson' di Go)
// Kita bisa impor 'Lesson' langsung dari Prisma karena modelnya cocok
type LessonFromGo = Lesson;

/**
 * ✅
 * Memanggil course-service (Go) untuk membuat Lesson baru
 */
export const createLessonService = async (
  chapterId: string,
  data: CreateLessonInput,
  authId: string // "Paspor"
): Promise<LessonFromGo> => {
  try {
    // Panggil endpoint Go yang baru saja Anda buat
    // POST /internal/chapters/:chapterId/lessons
    const response = await apiClient.post<LessonFromGo>(
      `/internal/chapters/${chapterId}/lessons`,
      data,
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
        'Error in createLessonService (BFF):',
        err.response?.data || err.message
      );
      if (err.response?.status === 403) {
        throw new Error('Forbidden: You do not own this course');
      }
      if (err.response?.status === 404) {
        throw new Error('Chapter not found');
      }
      const message = err.response?.data?.error || 'Failed to create lesson';
      throw new Error(message);
    } else if (err instanceof Error) {
      console.error('Error in createLessonService (BFF):', err.message);
      throw new Error(err.message);
    } else {
      console.error('Unknown error in createLessonService (BFF):', err);
      throw new Error('An unknown error occurred');
    }
  }
};


/**
 * ✅
 * Memanggil course-service (Go) untuk memperbarui metadata Lesson
 */
export const updateLessonService = async (
  lessonId: string,
  data: UpdateLessonInput, // Hanya data yang relevan untuk Teacher
  authId: string
): Promise<LessonFromGo> => {
  try {
    // Panggil endpoint Go yang baru saja Anda buat
    // PATCH /internal/lessons/:lessonId
    const response = await apiClient.patch<LessonFromGo>(
      `/internal/lessons/${lessonId}`,
      data, // Kirim body (title, order, isPreview)
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
        'Error in updateLessonService (BFF):',
        err.response?.data || err.message
      );
      if (err.response?.status === 403) {
        throw new Error('Forbidden: You do not own this lesson');
      }
      if (err.response?.status === 404) {
        throw new Error('Lesson not found');
      }
      const message = err.response?.data?.error || 'Failed to update lesson';
      throw new Error(message);
    } else if (err instanceof Error) {
      console.error('Error in updateLessonService (BFF):', err.message);
      throw new Error(err.message);
    } else {
      console.error('Unknown error in updateLessonService (BFF):', err);
      throw new Error('An unknown error occurred');
    }
  }
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
