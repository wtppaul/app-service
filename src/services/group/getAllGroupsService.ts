import { string } from 'zod';
import { prisma } from '../../utils/prisma';

export const getAllCategoriesService = async () => {
  const categories = await prisma.category.findMany({
    where: {
      parentId: null,
    },
    include: {
      children: true,
    },
    orderBy: {
      name: 'asc',
    },
  });

  return categories;
};

export const getAllTagsService = async () => {
  const tags = await prisma.tag.findMany({
    orderBy: { name: 'asc' },
    select: {
      id: true,
      name: true,
      slug: true,
      // _count: {
      //   select: { courses: true },
      // },
    },
  });

  return tags;
};
