// utils/queryParser.ts
import { subDays, startOfDay, endOfDay } from 'date-fns';
import { z } from 'zod';

const querySchema = z.object({
  level: z.string().optional(),
  status: z.string().optional(), // dipisah dengan koma, ex: "PUBLISHED,APPROVED"
  teacherId: z.string().optional(),
  category: z.string().optional(),
  subCategory: z.string().optional(),
  createdAt: z.string().optional(), // ISO date format
  search: z.string().optional(),
  tag: z.string().optional(),
});

export function parseQueryParams(rawQuery: any) {
  const parsed = querySchema.safeParse(rawQuery);

  if (!parsed.success) {
    throw new Error('Invalid query parameters');
  }

  const {
    level,
    status,
    teacherId,
    category,
    subCategory,
    search,
    createdAt,
    tag,
  } = parsed.data;
  const filters: any = {};

  if (tag) filters.tag = tag;
  if (level) filters.level = level;
  if (teacherId) filters.teacherId = teacherId;
  if (category) filters.categorySlug = category;
  if (subCategory) filters.subCategorySlug = subCategory;
  if (status) {
    filters.status = {
      in: status.split(','),
    };
  } else {
    filters.status = {
      not: 'UNPUBLISHED',
    };
  }

  // 🟢 Filter createdAt

  /**
   * GET /courses?createdAt=today
   *
   * GET /courses?createdAt=last7days
   *
   * GET /courses?createdAt=custom:2024-03-01,2024-03-15
   * Format custom: harus dipisahkan koma, tanggal dalam format ISO (YYYY-MM-DD).
   *
   */

  if (createdAt) {
    const now = new Date();

    if (createdAt === 'today') {
      filters.createdAt = {
        gte: startOfDay(now),
        lte: endOfDay(now),
      };
    }
    if (createdAt === 'last7days') {
      filters.createdAt = {
        gte: subDays(now, 7),
        lte: now,
      };
    }
    if (createdAt === 'last30days') {
      filters.createdAt = {
        gte: subDays(now, 30),
        lte: now,
      };
    }
    if (createdAt.startsWith('custom:')) {
      const [from, to] = createdAt.replace('custom:', '').split(',');
      if (from && to) {
        filters.createdAt = {
          gte: new Date(from),
          lte: new Date(to),
        };
      }
    }
  }

  if (search) {
    filters.OR = [
      { title: { contains: search, mode: 'insensitive' } },
      { description: { contains: search, mode: 'insensitive' } },
    ];
  }
  console.log('PARSE FILTER2: : ', filters);
  return filters;
}
