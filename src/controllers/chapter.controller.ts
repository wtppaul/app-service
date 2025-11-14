import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import {
  createChapterWithLessonsService,
  createChapterService,
  reorderChaptersService,
  updateChapterService,
  deleteChapterService,
} from '../services/chapter.service';
import { validateCourseOwnership } from '../utils/validateAccess';
import { prisma } from '../utils/prisma';
import sanitizeInput from '../utils/xInputSanitize';

const createChapterWithLessonsSchema = z.object({
  rawTitle: z.string().min(8),
  chapterId: z.string().optional(),
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

export const createChapterWithLessonsController = async (
  req: FastifyRequest<{
    Params: { courseId: string };
    Body: unknown;
  }>,
  reply: FastifyReply
) => {
  const user = (req as any).user;
  const { courseId } = req.params;
  console.log('PARAMS ::: ', req.params);
  const parsed = createChapterWithLessonsSchema.safeParse(
    sanitizeInput(req.body)
  );

  if (!parsed.success) {
    console.warn('❌ Chapter validation failed', parsed.error.flatten());
    return reply.status(400).send({ error: parsed.error.flatten() });
  }

  const isOwner = await validateCourseOwnership(user.id, courseId, user.role);
  if (!isOwner) {
    return reply.status(403).send({ message: 'Unauthorized' });
  }

  const { rawTitle, order, lessons, chapterId } = parsed.data;
  console.log('BODY 🔴🔻🔻🔴 ::: ', parsed.data);
  const normalizedLessons = lessons?.map((lesson, index) => ({
    ...lesson,
    order: lesson.order ?? index,
  }));

  try {
    const newChapter = await createChapterWithLessonsService(
      courseId,
      rawTitle,
      order,
      normalizedLessons,
      chapterId
    );
    return reply.status(201).send(newChapter);
  } catch (err) {
    console.error(err);
    return reply.status(500).send({ message: 'Failed to create chapter' });
  }
};

const updateChapterSchema = z.object({
  rawTitle: z.string().min(8),
  order: z.number().optional(),
});

export const updateChapterController = async (
  req: FastifyRequest<{
    Params: { courseId: string; chapterId: string };
    Body: unknown;
  }>,
  reply: FastifyReply
) => {
  const { courseId, chapterId } = req.params;

  const parse = updateChapterSchema.safeParse(sanitizeInput(req.body));
  if (!parse.success)
    return reply.status(400).send({ error: parse.error.flatten() });

  const { rawTitle, order } = parse.data;
  const user = (req as any).user;

  const isOwner = await validateCourseOwnership(user.id, courseId, user.role);
  if (!isOwner) {
    return reply.status(403).send({ message: 'Unauthorized' });
  }

  const updatedChapter = await updateChapterService({
    courseId,
    chapterId,
    rawTitle,
    order,
  });

  return reply.send(updatedChapter);
};

const createChapterSchema = z.object({
  title: z.string().min(8, 'Title must be at least 8 characters long'),
  order: z.number().int().optional().default(0),
});

const reorderChapterSchema = z.object({
  chapters: z.array(
    z.object({
      id: z.string(),
      order: z.number(),
    })
  ),
});

export const addChapterToCourseController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { courseId } = req.params as { courseId: string };

    // 1. Validasi Input (Logika Bisnis BFF)
    const result = createChapterSchema.safeParse(req.body);
    if (!result.success) {
      return reply
        .status(400)
        .send({ message: 'Invalid input', errors: result.error.flatten() });
    }
    const data = result.data; // { title, order }

    // 2. Ambil User (Logika Bisnis BFF)
    const user = (req as any).user;
    if (!user || !user.id || !user.role) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    // 3. Validasi Kepemilikan (Logika Bisnis "Pintar" BFF)
    //    BFF (Fastify) memanggil Prisma untuk memastikan
    //    user ini adalah pemilik kursus SEBELUM memanggil service Go.
    const isOwner = await validateCourseOwnership(user.id, courseId, user.role);
    if (!isOwner) {
      return reply.status(403).send({ message: 'Access Denied.' });
    }
    
    // 4. Panggil Go service "bodoh" (via service axios)
    const newChapter = await createChapterService(
      courseId,
      data,
      user.id // Kirim "Paspor"
    );

    return reply.status(201).send(newChapter);

  } catch (err: unknown) {
    // Error handling yang aman
    console.error('Error in addChapterToCourseController (BFF):', err);
    if (err instanceof Error) {
      if (err.message.includes('Forbidden')) {
         return reply.status(403).send({ message: err.message });
      }
      if (err.message.includes('not found')) {
         return reply.status(404).send({ message: err.message });
      }
      return reply.status(500).send({ message: err.message });
    }
    return reply.status(500).send({ message: 'An unknown error occurred' });
  }
};

/**
 * api/courses/89c0c074-2268-4bae-b2c6-f58869355703/chapters/reorder
 *
 * {
 * "chapters": [
 *   { "id": "0b941c10-1cf8-4097-8af2-2eaf8acf3749", "order": 0 },
 *   { "id": "d5083662-2291-4c29-b04f-4b6237e4130f", "order": 1 }
 *	]
 *}
 *
 */
export const reorderChaptersController = async (
  req: FastifyRequest<{ Params: { courseId: string }; Body: unknown }>,
  reply: FastifyReply
) => {
  const parse = reorderChapterSchema.safeParse(sanitizeInput(req.body));
  if (!parse.success)
    return reply.status(400).send({ error: parse.error.flatten() });

  const user = (req as any).user;
  const { courseId } = req.params;

  const isOwner = await validateCourseOwnership(user.id, courseId, user.role);
  if (!isOwner) return reply.status(403).send({ message: 'Unauthorized' });

  await reorderChaptersService(courseId, parse.data.chapters);
  reply.code(200).send({ message: 'Chapter order updated' });
};

export const getChaptersAndLessonsController = async (
  req: FastifyRequest<{ Params: { slug: string } }>,
  reply: FastifyReply
) => {
  try {
    // 🔐 CONTROL ENROLLMENT
    // const user = (req as any).user;
    // const { courseId } = req.params;

    // const isPurchased = await validateUserEnrollment(user._id, courseId);
    // if (!isPurchased) {
    //   return reply
    //     .status(403)
    //     .send({ message: `You're not enrolled this course yet.` });
    // }

    const chapters = await prisma.chapter.findMany({
      where: { slug: req.params.slug },
      orderBy: { order: 'asc' },
      include: {
        lessons: {
          orderBy: { order: 'asc' },
        },
      },
    });

    reply.send(chapters);
  } catch (err) {
    console.error(err);
    reply.status(500).send({ message: 'Failed to fetch course structure' });
  }
};

export const deleteChapterController = async (
  req: FastifyRequest<{
    Params: { courseId: string; chapterId: string };
  }>,
  reply: FastifyReply
) => {
  const user = (req as any).user;
  const { courseId, chapterId } = req.params;

  const isOwner = await validateCourseOwnership(user.id, courseId, user.role);
  if (!isOwner) {
    return reply.status(403).send({ message: 'Unauthorized' });
  }

  await deleteChapterService(courseId, chapterId);

  return reply.code(204).send(); // No Content
};
