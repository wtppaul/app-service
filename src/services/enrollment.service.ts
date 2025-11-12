import { prisma } from '../utils/prisma';

/**
 * Mengecek apakah user telah mendaftar course tertentu
 */
export const checkEnrollmentService = async (
  userId: string,
  courseId: string
): Promise<boolean> => {
  const enrollment = await prisma.enrollment.findUnique({
    where: {
      authId_courseId: {
        authId: userId,
        courseId,
      },
    },
  });

  return Boolean(enrollment);
};

type GetMyCoursesParams = {
  userId: string;
  page: number;
  limit: number;
  search: string;
  categoryId?: string;
};

export const getMyCoursesService = async ({
  userId,
  page,
  limit,
  search,
  categoryId,
}: GetMyCoursesParams) => {
  const offset = (page - 1) * limit;

  const where: any = {
    enrollments: {
      some: { authId: userId },
    },
  };

  if (search) {
    where.title = { contains: search, mode: 'insensitive' };
  }

  if (categoryId) {
    where.categories = {
      some: { id: categoryId },
    };
  }

  const [courses, totalCourses] = await Promise.all([
    prisma.course.findMany({
      where,
      skip: offset,
      take: limit,
      include: {
        categories: true,
        teacher: true,
      },
    }),
    prisma.course.count({ where }),
  ]);

  const totalPages = Math.ceil(totalCourses / limit);

  return {
    data: courses,
    page,
    limit,
    totalCourses,
    totalPages,
  };
};
