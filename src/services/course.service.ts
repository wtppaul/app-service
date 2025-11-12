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
interface ChapterFromGo {
  id: string;
  title: string;
  order: number;
  lessons: LessonFromGo[] | null;
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

export const getAllCoursesService = async ({
  filters,
  page,
  limit,
}: GetAllCoursesParams) => {
  try {
    const offset = (page - 1) * limit;

    const [courses, totalCourses] = await Promise.all([
      prisma.course.findMany({
        where: filters,
        orderBy: { createdAt: 'desc' },
        skip: offset,
        take: limit,
        include: {
          teacher: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          categories: {
            select: {
              id: true,
              name: true,
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
            },
          },
          reviews: true,
        },
      }),
      prisma.course.count({ where: filters }),
    ]);

    const totalPages = Math.ceil(totalCourses / limit);

    return {
      data: courses,
      page,
      limit,
      totalCourses,
      totalPages,
    };
  } catch (err) {
    console.error('Error in getAllCoursesService:', err);
    throw new Error('Failed to get all courses');
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

export const getAllCoursesByCategoryService = async ({
  filters,
  page,
  limit,
}: GetAllCoursesParams) => {
  try {
    const { status, level, categorySlug, subCategorySlug } = filters;

    const where: any = {};

    if (status) where.status = status;
    if (level) where.level = level;

    if (categorySlug || subCategorySlug) {
      where.categories = {
        some: {
          ...(subCategorySlug
            ? { slug: subCategorySlug }
            : { parent: { slug: categorySlug } }),
        },
      };
    }

    const skip = (page - 1) * limit;

    const [courses, totalCourses] = await Promise.all([
      prisma.course.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          categories: {
            include: {
              children: true,
              parent: true,
            },
          },
          teacher: {
            select: {
              id: true,
              name: true,
              username: true,
            },
          },
          tags: {
            select: {
              id: true,
              name: true,
            },
          },
          reviews: true,
        },
      }),

      prisma.course.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCourses / limit);

    return {
      data: courses,
      page,
      limit,
      totalPages,
      totalCourses,
    };
  } catch (err) {
    console.error('Error in getAllCoursesByCategoryService:', err);
    throw new Error('Failed to get all courses');
  }
};

export const getAllCoursesByTagService = async ({
  filters,
  page,
  limit,
}: GetAllCoursesParams) => {
  try {
    const { status, level, tag } = filters;

    const where: any = {};

    // Filter status dan level
    if (status) where.status = status;
    if (level) where.level = level;
    if (tag) {
      where.tags = {
        some: {
          slug: tag,
        },
      };
    }

    const [courses, totalCourses] = await Promise.all([
      prisma.course.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        orderBy: { createdAt: 'desc' },
        include: {
          tags: {
            select: {
              id: true,
              name: true,
              slug: true,
            },
          },
          categories: {
            select: {
              name: true,
              slug: true,
            },
          },
          reviews: true,
        },
      }),

      prisma.course.count({ where }),
    ]);

    const totalPages = Math.ceil(totalCourses / limit);

    return {
      data: courses,
      page,
      limit,
      totalPages,
      totalCourses,
    };
  } catch (err) {
    console.error('Error in getAllCoursesByTagService:', err);
    throw new Error('Failed to get all courses');
  }
};
// ⬜⬜⬜ bySlug
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

export const getCourseByIdService = async (courseId: string) => {
  try {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: {
        teacher: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
        categories: {
          select: {
            id: true,
            name: true,
          },
        },
        tags: {
          select: {
            id: true,
            name: true,
          },
        },
        chapters: {
          orderBy: { order: 'asc' },
          include: {
            lessons: {
              orderBy: { order: 'asc' },
            },
            _count: {
              select: {
                lessons: true,
              },
            },
          },
        },
        reviews: {
          select: {
            rating: true,
            comment: true,
            student: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
        },
        _count: {
          select: {
            chapters: true,
          },
        },
      },
    });

    if (!course) {
      throw new Error('Course not found');
    }
    const totalLessons = course.chapters.reduce(
      (sum, chapter) => sum + chapter._count.lessons,
      0
    );
    const description = statusDescriptions[course.status];
    // Merge manual field totalChapters to returned course object
    return {
      ...course,
      totalChapters: course._count.chapters,
      totalLessons,
      statusDescription: description,
    };
  } catch (err) {
    console.error('Error in getCourseByIdService:', err);
    throw new Error('Failed to get course by id');
  }
};

// --- ⬜⬜⬜ FUNGSI INI AKAN KITA REFACTOR SEKARANG ---
export const createCourseService = async (
  data: CreateCourseInput, // ✅ PERBAIKAN: Gunakan tipe input dari Zod
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

// path: services/course.service.ts

export const updateCourseStatusById = async (
  courseId: string,
  status: CourseStatus
) => {
  try {
    const updated = await prisma.course.update({
      where: { id: courseId },
      data: { status },
    });
    return updated;
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return null;
    }
    throw error;
  }
};

export const updateCourseTagsService = async (
  courseId: string,
  tagIds: string[]
) => {
  if (!courseId) throw new Error('Course ID is required');

  const course = await prisma.course.findUnique({ where: { id: courseId } });
  if (!course) throw new Error('Course not found');

  return prisma.course.update({
    where: { id: courseId },
    data: {
      tags: {
        set: [], // remove existing tags
        connect: tagIds.map((id) => ({ id })), // add new ones
      },
    },
    include: { tags: true }, // optional: return tags data
  });
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

export const getCoursesITeachService = async ({
  teacherId,
}: GetCoursesITeachParams) => {
  const courses = await prisma.course.findMany({
    where: {
      teacherId,
    },
    include: {
      categories: true,
      chapters: {
        select: {
          id: true,
        },
      },
      teacher: {
        select: {
          id: true,
          name: true,
          username: true,
        },
      },
    },
    orderBy: {
      createdAt: 'desc',
    },
  });

  return courses.map((course) => ({
    id: course.id,
    title: course.title,
    slug: course.slug,
    description: course.description,
    thumbnail: course.thumbnail,
    price: course.price,
    level: course.level,
    status: course.status,
    categories: course.categories,
    totalChapters: course.chapters.length,
    createdAt: course.createdAt,
    updatedAt: course.updatedAt,
    teacher: course.teacher,
  }));
};
