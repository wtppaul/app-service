import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { createLesson, reorderLessons } from '../services/lesson.service';
import { prisma } from '../utils/prisma';
import { validateCourseOwnership } from '../utils/validateAccess';
import sanitizeInput from '../utils/xInputSanitize';
import { createChapterService } from '../services/chapter.service';
import { generateCourseSlug, generateChapterSlug } from '../utils/slug';
import { Lesson } from '../../generated/prisma';

const createLessonSchema = z.object({
  title: z.string().min(1),
  playbackId: z.string().min(1),
  duration: z.number().optional(),
  order: z.number(), // wajib ya biar Prisma nggak error
  isPreview: z.boolean().optional(),
});

const reorderLessonSchema = z.array(
  z.object({
    id: z.string(),
    order: z.number(),
  })
);

export const addLessonToChapterController = async (
  req: FastifyRequest<{ Params: { chapterId: string }; Body: unknown }>,
  reply: FastifyReply
) => {
  const parse = createLessonSchema.safeParse(req.body);
  if (!parse.success)
    return reply.status(400).send({ error: parse.error.flatten() });

  const user = (req as any).user;
  const { chapterId } = req.params;
  const { title, playbackId, duration, order } = parse.data;

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: { course: true },
  });
  if (!chapter) return reply.status(404).send({ message: 'Chapter not found' });

  const isOwner = await validateCourseOwnership(
    user.id,
    chapter.courseId,
    user.role
  );
  if (!isOwner) return reply.status(403).send({ message: 'Unauthorized' });

  const lesson = await createLesson(
    chapterId,
    title,
    playbackId,
    duration,
    order
  );
  reply.code(201).send(lesson);
};

export const createEmptyLesson = async (
  req: FastifyRequest<{ Params: { chapterId: string }; Body: Partial<Lesson> }>,
  reply: FastifyReply
) => {
  const user = (req as any).user;
  const { chapterId } = req.params;
  console.log('sjhgdbxj :: ', user);
  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: { course: true },
  });

  if (!chapter) {
    return reply.status(404).send({ message: 'Chapter not found' });
  }

  const isOwner = await validateCourseOwnership(
    user.id,
    chapter.courseId,
    user.role
  );
  if (!isOwner) {
    return reply.status(403).send({ message: 'Unauthorized' });
  }

  const newLesson = await prisma.lesson.create({
    data: {
      chapterId,
      title: '', // kosong dulu
      playbackId: '', // kosong dulu
      duration: 0,
      order: req.body.order ?? 0,
    },
  });

  return reply.code(201).send(newLesson);
};

export const reorderLessonsController = async (
  req: FastifyRequest<{ Params: { chapterId: string }; Body: unknown }>,
  reply: FastifyReply
) => {
  const parse = reorderLessonSchema.safeParse(req.body);
  if (!parse.success)
    return reply.status(400).send({ error: parse.error.flatten() });

  const user = (req as any).user;
  const { chapterId } = req.params;

  const chapter = await prisma.chapter.findUnique({
    where: { id: chapterId },
    include: { course: true },
  });
  if (!chapter) return reply.status(404).send({ message: 'Chapter not found' });

  const isOwner = await validateCourseOwnership(
    user.id,
    chapter.courseId,
    user.role
  );
  if (!isOwner) return reply.status(403).send({ message: 'Unauthorized' });

  await reorderLessons(chapterId, parse.data);
  reply.code(200).send({ message: 'Lesson order updated' });
};

const updateLessonSchema = z.object({
  title: z.string().optional(),
  playbackId: z.string().optional(),
  duration: z.number().optional(),
  order: z.number().optional(),
  isPreview: z.boolean().optional(),
});

export const updateLessonController = async (
  req: FastifyRequest<{ Params: { id: string }; Body: unknown }>,
  reply: FastifyReply
) => {
  const parse = updateLessonSchema.safeParse(req.body);
  if (!parse.success) {
    return reply.status(400).send({ error: parse.error.flatten() });
  }

  const user = (req as any).user;
  const lesson = await prisma.lesson.findUnique({
    where: { id: req.params.id },
    include: { chapter: true },
  });

  if (!lesson) {
    return reply.status(404).send({ message: 'Lesson not found' });
  }

  const isOwner = await validateCourseOwnership(
    user.id,
    lesson.chapter.courseId,
    user.role
  );

  if (!isOwner) return reply.status(403).send({ message: 'Unauthorized' });

  if (lesson.isPreview && !lesson.playbackId) {
    return reply.status(400).send({
      error: 'Project must be saved before enabling preview',
    });
  }
  try {
    const updated = await prisma.lesson.update({
      where: { id: req.params.id },
      data: parse.data,
    });

    reply.send(updated);
  } catch (err) {
    console.error(err);
    reply.status(500).send({ message: 'Failed to update lesson' });
  }
};

export const getLessonController = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  const { id } = req.params;
  const user = (req as any).user;

  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id },
      include: { chapter: true },
    });

    if (!lesson) {
      return reply.status(404).send({ message: 'Lesson not found' });
    }
    const isOwner = await validateCourseOwnership(
      user.id,
      lesson.chapter.courseId,
      user.role
    );

    if (!isOwner) return reply.status(403).send({ message: 'Unauthorized' });

    return reply.send(lesson);
  } catch (err) {
    console.error('Failed to get lesson:', err);
    return reply.status(500).send({ message: 'Failed to fetch lesson' });
  }
};

export const deleteLessonController = async (
  req: FastifyRequest<{ Params: { id: string } }>,
  reply: FastifyReply
) => {
  try {
    const user = (req as any).user;
    const lesson = await prisma.lesson.findUnique({
      where: { id: req.params.id },
      include: { chapter: true },
    });

    if (!lesson) {
      return reply.status(404).send({ message: 'Lesson not found' });
    }

    const isOwner = await validateCourseOwnership(
      user.id,
      lesson.chapter.courseId,
      user.role
    );

    if (!isOwner) return reply.status(403).send({ message: 'Unauthorized' });

    await prisma.lesson.delete({ where: { id: req.params.id } });
    reply.send({ message: 'Lesson deleted' });
  } catch (err) {
    console.error(err);
    reply.status(500).send({ message: 'Failed to delete lesson' });
  }
};

export const getLessonDurationByIdController = async (
  req: FastifyRequest<{ Params: { lessonId: string } }>,
  reply: FastifyReply
) => {
  const { lessonId } = req.params;
  const user = (req as any).user;
  console.log('sjhgdbxj :: ', user);
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { chapter: true },
  });

  if (!lesson) {
    return reply.status(404).send({ message: 'Lesson not found' });
  }
  console.log('asasrewres ::: ', lesson.chapter.courseId);

  const isOwner = await validateCourseOwnership(
    user.id,
    lesson.chapter.courseId,
    user.role
  );

  if (!isOwner) return reply.status(403).send({ message: 'Unauthorized' });

  try {
    const lesson = await prisma.lesson.findUnique({
      where: { id: lessonId },
      select: { id: true, duration: true, playbackId: true },
    });

    if (!lesson) {
      return reply.status(404).send({ error: 'Lesson not found' });
    }

    return reply.send(lesson);
  } catch (err) {
    console.error('❌ Failed to fetch lesson duration:', err);
    return reply.status(500).send({ error: 'Internal server error' });
  }
};
