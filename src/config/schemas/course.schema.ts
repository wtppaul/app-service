// src/schema/course.schema.ts
import { z } from 'zod';

export const createCourseSchema = z.object({
  title: z
    .string()
    .min(10, 'Title is required, with minimum 10 characters')
    .max(100, 'Title must be at most 100 characters'),
  description: z
    .string()
    .min(20, 'Title is required, with minimum 20 characters')
    .max(2000, 'Title must be at most 2000 characters'),
  thumbnail: z.string().url('Thumbnail must be a valid URL'),
  price: z.number().nonnegative('Price must be a non-negative number'),
  level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']),
  categoryIds: z
    .array(z.string().min(1))
    .min(1, 'At least one category is required'),
  hashtags: z
    .array(
      z
        .string()
        .min(2, 'Hashtag must be at 2-20 characters')
        .max(20, 'Hashtag must be at 2-20 characters')
    )
    .max(5, 'Max. 5 tags')
    .optional()
    .default([]),
  slug: z.string().optional(),
});

export const updateCourseSchema = createCourseSchema.partial();

export const curateCourseSchema = z.object({
  tagIds: z.array(z.string().min(1)).min(1, 'At least one tag is required'),
});
