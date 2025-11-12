import { prisma } from '../utils/prisma';

export const getStatsPerCategoryService = async () => {
  const categories = await prisma.category.findMany({
    where: { parentId: null },
    include: {
      children: {
        include: {
          courses: {
            include: { teacher: true },
          },
        },
      },
      courses: {
        include: { teacher: true },
      },
    },
  });

  const result = categories.map((parent) => {
    const allCourses = [
      ...parent.courses,
      ...parent.children.flatMap((child) => child.courses),
    ];

    const uniqueTeacherIds = new Set(
      allCourses.map((course) => course.teacherId)
    );

    return {
      parentCategory: parent.name,
      slug: parent.slug,
      totalCourses: allCourses.length,
      totalTeachers: uniqueTeacherIds.size,
      children: parent.children.map((child) => {
        const teacherIds = new Set(child.courses.map((c) => c.teacherId));
        return {
          subCategory: child.name,
          slug: child.slug,
          totalCourses: child.courses.length,
          totalTeachers: teacherIds.size,
        };
      }),
    };
  });

  return result;
};

export const getStatsPerTagService = async () => {
  const tags = await prisma.tag.findMany({
    include: {
      courses: {
        include: {
          teacher: true,
        },
      },
    },
  });

  const result = tags.map((tag) => {
    const teacherIds = new Set(tag.courses.map((c) => c.teacherId));
    return {
      tag: tag.name,
      totalCourses: tag.courses.length,
      totalTeachers: teacherIds.size,
    };
  });

  return result;
};

export const getStatsCategoryTeachersService = async () => {
  const categories = await prisma.category.findMany({
    include: {
      courses: {
        where: { status: 'PUBLISHED' },
        include: {
          teacher: {
            select: {
              id: true,
              username: true,
              courses: {
                select: {
                  title: true,
                  slug: true,
                  categories: {
                    select: {
                      name: true,
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const result = categories.map((cat) => {
    const uniqueTeachersMap = new Map();

    cat.courses.forEach((course) => {
      if (course.teacher) {
        uniqueTeachersMap.set(course.teacher.id, course.teacher);
      }
    });

    return {
      category: cat.name,
      totalCourses: cat.courses.length,
      totalTeachers: uniqueTeachersMap.size,
      teachers: Array.from(uniqueTeachersMap.values()),
    };
  });

  return result;
};

export const getStatsTagTeachersService = async () => {
  const tags = await prisma.tag.findMany({
    include: {
      courses: {
        where: { status: 'PUBLISHED' }, // optional: hanya course yang rilis
        include: {
          teacher: {
            select: {
              id: true,
              username: true,
              courses: {
                select: {
                  title: true,
                  slug: true,
                  categories: {
                    select: {
                      name: true,
                      slug: true,
                    },
                  },
                  tags: {
                    select: {
                      slug: true,
                    },
                  },
                },
              },
            },
          },
        },
      },
    },
  });

  const result = tags.map((tag) => {
    const uniqueTeachersMap = new Map();

    tag.courses.forEach((course) => {
      if (course.teacher) {
        uniqueTeachersMap.set(course.teacher.id, course.teacher);
      }
    });

    return {
      tag: tag.name,
      totalCourses: tag.courses.length,
      totalTeachers: uniqueTeachersMap.size,
      teachers: Array.from(uniqueTeachersMap.values()),
    };
  });

  return result;
};
