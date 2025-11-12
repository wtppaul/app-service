import { z } from 'zod';

export const publicCourseQuerySchema = z.object({
  status: z.literal('PUBLISHED'),
  level: z.optional(z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED'])),
});

export const adminCourseQuerySchema = z
  .object({
    status: z
      .enum([
        'DRAFT',
        'INCOMPLETE',
        'PUBLISHED',
        'PENDING_REVIEW',
        'FOLLOWED_UP',
        'APPROVED',
        'REJECTED',
        'UNPUBLISHED',
        'ARCHIVED',
      ])
      .optional(),
    level: z.enum(['BEGINNER', 'INTERMEDIATE', 'ADVANCED']).optional(),
    createdAt: z
      .enum(['today', 'last3days', 'last7days', 'last30days'])
      .optional(), // Bisa ubah jadi date string ISO jika mau lebih ketat
  })
  .passthrough(); // untuk antisipasi query fleksibel lain
