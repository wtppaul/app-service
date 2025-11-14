// src/services/course.service.ts
import { prisma } from '../utils/prisma';
import { Prisma } from '../../generated/prisma';
import { z } from 'zod';
import { createCourseSchema } from '../config/schemas/course.schema'; // Impor skema Zod
import { updateCourseSchema } from '../config/schemas/course.schema';
import { CourseCreateData, CourseUpdateData } from '../config/types/course';
import {
  CourseStatus as EnumCourseStatus, 
  CourseLevel, 
  CourseLicense } from '../../generated/prisma';
import { parseQueryParams } from '../utils/queryParser';
import { CourseStatus, statusDescriptions } from '../config/types/courseStatus';
import axios, { AxiosInstance } from 'axios';

type GetAllCoursesParams = {
  filters: any;
  page: number;
  limit: number;
};

type CreateCourseInput = z.infer<typeof createCourseSchema>;
type UpdateCourseInput = z.infer<typeof updateCourseSchema>;

interface LessonFromGo {
  id: string;
  title: string;
  order: number;
  playbackId: string;
  isPreview: boolean;
  duration: number;
}
interface TeacherFromGo {
  id: string;
  name: string;
  username: string;
}
interface CategoryFromGo {
  id: string;
  name: string;
  slug: string;
}

interface GoPaginationResponse {
  data: CourseFromGo[];
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export interface ChapterFromGo {
  id: string;
  title: string;
  order: number;
  lessons: LessonFromGo[] | null;
}

export interface CourseFromGo {
  id: string;
  title: string;
  description: string;
  thumbnail: string | null;
  price: number;
  teacherId: string;
  slug: string;
  level: CourseLevel;
  status: EnumCourseStatus; // Tipe yang benar
  isFree: boolean;
  license: CourseLicense;
  chapters: ChapterFromGo[] | null;

  // Relasi yang di-Preload
  teacher: TeacherFromGo;
  categories: CategoryFromGo[] | null;
  // tags: { id: string; name: string; slug: string }[] | null;
}

// Klien API Internal
const COURSE_SERVICE_URL = process.env.COURSE_SERVICE_URL || 'http://course-service:8083';
const INTERNAL_SECRET = process.env.INTERNAL_API_SECRET;

const apiClient: AxiosInstance = axios.create({
  baseURL: COURSE_SERVICE_URL,
  headers: {
    'Content-Type': 'application/json',
    'X-Internal-Secret': INTERNAL_SECRET,
  },
});


// ⬜⬜⬜ ✔
export const getAllCoursesService = async ({
  filters,
  page,
  limit,
}: GetAllCoursesParams): Promise<GoPaginationResponse> => {
  try {
    // 1. Siapkan query params
    const params = new URLSearchParams();
    params.append('page', page.toString());
    params.append('limit', limit.toString());

    // 2. Terapkan filter dinamis
    if (filters.status) {
      if (Array.isArray(filters.status)) {
        filters.status.forEach((s: string) => params.append('status', s));
      } else {
        params.append('status', filters.status);
      }
    }
    if (filters.level) {
      if (Array.isArray(filters.level)) {
        filters.level.forEach((l: string) => params.append('level', l));
      } else {
        params.append('level', filters.level);
      }
    }
    
    // Tambahkan filter Kategori & Tag (jika ada)
    // BFF meneruskan filter ini ke Go service
    if (filters.category) {
      if (Array.isArray(filters.category)) {
        filters.category.forEach((c: string) => params.append('category', c));
      } else {
        params.append('category', filters.category);
      }
    }
    if (filters.tag) {
       if (Array.isArray(filters.tag)) {
        filters.tag.forEach((t: string) => params.append('tag', t));
      } else {
        params.append('tag', filters.tag);
      }
    }


    // 3. Panggil endpoint Go
    const response = await apiClient.get<GoPaginationResponse>(
      '/internal/courses',
      { params: params } 
    );

    return response.data; // Kembalikan { data: [...], pagination: {...} }
  } catch (err: unknown) {
    // Error handling yang aman
    if (axios.isAxiosError(err)) {
      console.error(
        'Error in getAllCoursesService (BFF):',
        err.response?.data || err.message
      );
      const message = err.response?.data?.error || 'Failed to get all courses';
      throw new Error(message);
    } else if (err instanceof Error) {
      console.error('Error in getAllCoursesService (BFF):', err.message);
      throw new Error(err.message);
    } else {
      console.error('Unknown error in getAllCoursesService (BFF):', err);
      throw new Error('An unknown error occurred');
    }
  }
};

export const getCoursesByTeacherIdService = async (teacherId: string) => {
  return prisma.course.findMany({
    where: { teacherId },
    orderBy: { createdAt: 'desc' },
    include: {
      categories: true,
      teacher: {
        select: { id: true, name: true, username: true },
      },
    },
  });
};


// ⬜⬜⬜ ✔
export const getCourseBySlugService = async (
  slug: string
): Promise<CourseFromGo> => {
  try {
    const response = await apiClient.get<CourseFromGo>(
      `/internal/courses/slug/${slug}`
    );
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error(
        'Error in getCourseBySlugService (BFF):',
        err.response?.data || err.message
      );
      if (err.response?.status === 404) {
        throw new Error('Course not found');
      }
      const message = err.response?.data?.error || 'Failed to get course by slug';
      throw new Error(message);
    } else if (err instanceof Error) {
      console.error('Error in getCourseBySlugService (BFF):', err.message);
      throw new Error(err.message);
    } else {
      console.error('Unknown error in getCourseBySlugService (BFF):', err);
      throw new Error('An unknown error occurred');
    }
  }
};

// --- ⬜⬜⬜ ✔
export const getCourseByIdService = async (
  courseId: string
): Promise<CourseFromGo> => {
  try {
    // Panggil endpoint Go yang baru saja kita buat
    const response = await apiClient.get<CourseFromGo>(
      `/internal/courses/${courseId}`
    );
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error(
        'Error in getCourseByIdService (BFF):',
        err.response?.data || err.message
      );
      if (err.response?.status === 404) {
        throw new Error('Course not found');
      }
      const message = err.response?.data?.error || 'Failed to get course by id';
      throw new Error(message);
    } else if (err instanceof Error) {
      console.error('Error in getCourseByIdService (BFF):', err.message);
      throw new Error(err.message);
    } else {
      console.error('Unknown error in getCourseByIdService (BFF):', err);
      throw new Error('An unknown error occurred');
    }
  }
};

// --- ⬜⬜⬜ ✔
export const createCourseService = async (
  data: CreateCourseInput,
  authId: string
): Promise<CourseFromGo> => {
  try {
    // BFF (Fastify) hanya meneruskan 'title'.
    // Go service (handler) akan mengambil AuthID dari header 'X-Authenticated-User-ID'.
    const response = await apiClient.post<CourseFromGo>('/internal/courses', {
      title: data.title, // Go service hanya butuh 'title'
    });
    return response.data;
  } catch (err: unknown) {
    // Error handling yang aman
    if (axios.isAxiosError(err)) {
      console.error('Error in createCourseService (BFF):', err.response?.data || err.message);
      const message = err.response?.data?.error || 'Failed to create course';
      throw new Error(message);
    } else if (err instanceof Error) {
      console.error('Error in createCourseService (BFF):', err.message);
      throw new Error(err.message);
    } else {
      console.error('Unknown error in createCourseService (BFF):', err);
      throw new Error('An unknown error occurred');
    }
  }
};

// ⬜⬜⬜ ✔
export const updateCourseService = async (
  courseId: string,
  data: UpdateCourseInput, // Tipe Zod (dari controller)
  authId: string // "Paspor" (dari controller)
): Promise<CourseFromGo> => {
  try {
    // Panggil endpoint PATCH Go yang baru
    const response = await apiClient.patch<CourseFromGo>(
      `/internal/courses/${courseId}`,
      data, // Kirim data update (title, description, dll)
      {
        headers: {
          'X-Authenticated-User-ID': authId, // 💡 Kirim "Paspor" untuk verifikasi
        },
      }
    );
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error(
        'Error in updateCourseService (BFF):',
        err.response?.data || err.message
      );
      if (err.response?.status === 403) {
        throw new Error('Forbidden: You do not own this course');
      }
      if (err.response?.status === 404) {
        throw new Error('Course not found');
      }
      const message = err.response?.data?.error || 'Failed to update course';
      throw new Error(message);
    } else if (err instanceof Error) {
      console.error('Error in updateCourseService (BFF):', err.message);
      throw new Error(err.message);
    } else {
      console.error('Unknown error in updateCourseService (BFF):', err);
      throw new Error('An unknown error occurred');
    }
  }
};

export const updateCourseStatusService = async (
  slug: string,
  status: keyof typeof EnumCourseStatus // atau string literal yang akan dikonversi ke enum
) => {
  try {
    const enumStatus =
      EnumCourseStatus[status as keyof typeof EnumCourseStatus];

    const updated = await prisma.course.update({
      where: { slug },
      data: {
        status: { set: enumStatus },
      },
    });

    return updated;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return null; // Course not found
    }
    throw error;
  }
};

// ⬜⬜⬜ ✔
// (Menggantikan fungsi 'updateCourseStatusById' lama yang berbasis Prisma)
export const updateCourseStatusByIdService = async (
  courseId: string,
  status: EnumCourseStatus, // Menggunakan Tipe Enum dari Prisma
  authId: string
): Promise<CourseFromGo> => {
  try {
    // Panggil endpoint Go yang sudah kita siapkan
    const response = await apiClient.patch<CourseFromGo>(
      `/internal/courses/${courseId}/status`,
      { status: status }, // Body: { "status": "PUBLISHED" }
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
        'Error in updateCourseStatusByIdService (BFF):',
        err.response?.data || err.message
      );
      if (err.response?.status === 403) {
        throw new Error('Forbidden: You do not own this course');
      }
      if (err.response?.status === 404) {
        throw new Error('Course not found');
      }
      const message = err.response?.data?.error || 'Failed to update status';
      throw new Error(message);
    } else if (err instanceof Error) {
      console.error('Error in updateCourseStatusByIdService (BFF):', err.message);
      throw new Error(err.message);
    } else {
      console.error('Unknown error in updateCourseStatusByIdService (BFF):', err);
      throw new Error('An unknown error occurred');
    }
  }
};

// ⬜⬜⬜ ✔
export const updateCourseTagsService = async (
  courseId: string,
  tagIds: string[],
  authId: string
): Promise<{ message: string }> => { // Go service mengembalikan pesan sukses
  try {
    const response = await apiClient.patch<{ message: string }>(
      `/internal/courses/${courseId}/tags`,
      { tagIds: tagIds }, // Body: { "tagIds": ["uuid1", "uuid2"] }
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
        'Error in updateCourseTagsService (BFF):',
        err.response?.data || err.message
      );
      if (err.response?.status === 403) {
        throw new Error('Forbidden: You do not own this course');
      }
      if (err.response?.status === 404) {
        throw new Error('Course not found');
      }
      const message = err.response?.data?.error || 'Failed to update tags';
      throw new Error(message);
    } else if (err instanceof Error) {
      console.error('Error in updateCourseTagsService (BFF):', err.message);
      throw new Error(err.message);
    } else {
      console.error('Unknown error in updateCourseTagsService (BFF):', err);
      throw new Error('An unknown error occurred');
    }
  }
};

export const updateCoursePriceService = async (slug: string, price: number) => {
  try {
    const updated = await prisma.course.update({
      where: { slug },
      data: {
        price: { set: price }, // ✅ pakai set, karena kamu pakai enum di Prisma
      },
    });

    return updated;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      // Course not found
      return null;
    }
    throw error;
  }
};

interface GetCoursesITeachParams {
  teacherId: string;
}


// ⬜⬜⬜✔
export const getCoursesITeachService = async (
  { teacherId }: { teacherId: string },
  authId: string // "Paspor"
): Promise<CourseFromGo[]> => {
  try {
    // Panggil endpoint Go yang baru
    const response = await apiClient.get<CourseFromGo[]>(
      `/internal/teachers/${teacherId}/courses`, // Gunakan ID Profil
      {
        headers: {
          'X-Authenticated-User-ID': authId, // Kirim "Paspor" untuk otorisasi
        },
      }
    );
    return response.data;
  } catch (err: unknown) {
    if (axios.isAxiosError(err)) {
      console.error(
        'Error in getCoursesITeachService (BFF):',
        err.response?.data || err.message
      );
      if (err.response?.status === 403) {
        throw new Error('Forbidden: You can only view your own courses');
      }
      const message = err.response?.data?.error || 'Failed to get courses';
      throw new Error(message);
    } else if (err instanceof Error) {
      console.error('Error in getCoursesITeachService (BFF):', err.message);
      throw new Error(err.message);
    } else {
      console.error('Unknown error in getCoursesITeachService (BFF):', err);
      throw new Error('An unknown error occurred');
    }
  }
};
