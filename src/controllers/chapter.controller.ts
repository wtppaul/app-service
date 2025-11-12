import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import {
  createChapterWithLessonsService,
  createChapterService,
  reorderChaptersService,
  updateChapterService,
  deleteChapterService,
} from '../services/chapter.service';
import {
  validateCourseOwnership,
  validateUserEnrollment,
} from '../utils/validateAccess';
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
  title: z.string().min(8).optional(),
  order: z.number().optional(),
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
  req: FastifyRequest<{ Params: { courseId: string }; Body: unknown }>,
  reply: FastifyReply
) => {
  const parse = createChapterSchema.safeParse(sanitizeInput(req.body));
  if (!parse.success)
    return reply.status(400).send({ error: parse.error.flatten() });

  const user = (req as any).user;
  const { courseId } = req.params;
  const { title, order } = parse.data;

  const isOwner = await validateCourseOwnership(user.id, courseId, user.role);
  if (!isOwner) return reply.status(403).send({ message: 'Unauthorized' });

  const newChapter = await createChapterService(courseId, title, order);
  reply.code(201).send(newChapter);
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
