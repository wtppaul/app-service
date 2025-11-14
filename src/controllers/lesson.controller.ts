import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import {
  createLessonService,
  createLessonSchema,
    updateLessonService, 
  updateLessonSchema, 
} from '../services/lesson.service';
import { prisma } from '../utils/prisma';
import { validateCourseOwnership, validateLessonOwnership } from '../utils/validateAccess';
import sanitizeInput from '../utils/xInputSanitize';
import { createChapterService } from '../services/chapter.service';
import { generateCourseSlug, generateChapterSlug } from '../utils/slug';
import { Lesson } from '../../generated/prisma';
import { validateChapterOwnership } from '../utils/validateAccess';

const reorderLessonSchema = z.array(
  z.object({
    id: z.string(),
    order: z.number(),
  })
);

// const updateLessonSchema = z.object({
//   title: z.string().optional(),
//   playbackId: z.string().optional(),
//   duration: z.number().optional(),
//   order: z.number().optional(),
//   isPreview: z.boolean().optional(),
// });

export const addLessonToChapterController = async (
  req: FastifyRequest<{ Params: { chapterId: string }; Body: unknown }>,
  reply: FastifyReply
) => {
  const parse = createLessonSchema.safeParse(req.body);
  if (!parse.success)
    return reply.status(400).send({ error: parse.error.flatten() });

  const user = (req as any).user;
  const { chapterId } = req.params;
  const { title, order } = parse.data;

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

  // const lesson = await createLessonService(
  //   chapterId,
  //   title,
  //   playbackId,
  //   duration,
  //   order
  // );
  // reply.code(201).send(lesson);
};

/**
 * ✅ 
 * (INI ADALAH FUNGSI BFF YANG "PINTAR")
 * Menangani pembuatan lesson baru (kosong).
 * Ini adalah handler untuk: POST /:chapterId/lessons
 */
export const createEmptyLesson = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { chapterId } = req.params as { chapterId: string };

    // 1. Validasi Input (Logika Bisnis BFF)
    const result = createLessonSchema.safeParse(req.body);
    if (!result.success) {
      return reply
        .status(400)
        .send({ message: 'Invalid input', errors: result.error.flatten() });
    }
    const data = result.data;

    // 2. Ambil User (Logika Bisnis BFF)
    const user = (req as any).user;
    if (!user || !user.id || !user.role) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    // 3. Validasi Kepemilikan "Pintar" (BFF)
    //    (Cek apakah user ini pemilik chapter)
    const isOwner = await validateChapterOwnership(
      user.id,
      chapterId,
      user.role
    );
    if (!isOwner) {
      return reply.status(403).send({ message: 'Access Denied.' });
    }

    // 4. Panggil Go service "bodoh" (via service axios)
    const newLesson = await createLessonService(
      chapterId,
      data,
      user.id // Kirim "Paspor"
    );

    return reply.status(201).send(newLesson);
  } catch (err: unknown) {
    // Error handling yang aman
    console.error('Error in createEmptyLesson (BFF):', err);
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

  // await reorderLessons(chapterId, parse.data);
  reply.code(200).send({ message: 'Lesson order updated' });
};

/**
 * ✅ --- FUNGSI INI SEKARANG DIPERBAIKI (Refactored) ---
 * (INI ADALAH FUNGSI BFF YANG "PINTAR")
 * Menangani update metadata lesson (oleh Teacher).
 * Ini adalah handler untuk: PATCH /lessons/:id
 */
export const updateLessonController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { id } = req.params as { id: string }; // Ini adalah lessonId

    // 1. Validasi Input (Logika Bisnis BFF)
    const result = updateLessonSchema.safeParse(req.body);
    if (!result.success) {
      return reply
        .status(400)
        .send({ message: 'Invalid input', errors: result.error.flatten() });
    }
    const data = result.data; // { title?, order?, isPreview? }

    // 2. Ambil User (Logika Bisnis BFF)
    const user = (req as any).user;
    if (!user || !user.id || !user.role) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    // 3. Validasi Kepemilikan "Pintar" (BFF)
    //    (Kita perlu fungsi 'validateLessonOwnership' baru)
    const isOwner = await validateLessonOwnership(
      user.id,
      id, // lessonId
      user.role
    );
    if (!isOwner) {
      return reply.status(403).send({ message: 'Access Denied.' });
    }

    // 4. Panggil Go service "bodoh" (via service axios)
    const updatedLesson = await updateLessonService(
      id, // lessonId
      data,
      user.id // Kirim "Paspor"
    );

    return reply.status(200).send(updatedLesson);
  } catch (err: unknown) {
    // Error handling yang aman
    console.error('Error in updateLessonController (BFF):', err);
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
