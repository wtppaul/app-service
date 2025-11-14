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
import { updateChapterSchema, reorderChaptersSchema } from '../services/chapter.service';
import { getCourseByIdService } from '../services/course.service'; 
import { checkEnrollmentService } from '../services/payment.service'; 
import { CourseStatus as EnumCourseStatus } from '../../generated/prisma';
import { CourseFromGo } from '../services/course.service';

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

/**
 * ✅ 
 * (INI ADALAH FUNGSI BFF YANG "PINTAR")
 * Menangani pembaruan chapter.
 * Ini adalah handler untuk: PATCH /:courseId/chapters/:chapterId
 */
export const updateChapterController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { courseId, chapterId } = req.params as { courseId: string; chapterId: string };

    // 1. Validasi Input (Logika Bisnis BFF)
    //    Kita gunakan skema Zod dari service
    const result = updateChapterSchema.safeParse(req.body);
    if (!result.success) {
      return reply
        .status(400)
        .send({ message: 'Invalid input', errors: result.error.flatten() });
    }
    const data = result.data; // { title?, order? }

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
    const updatedChapter = await updateChapterService(
      courseId,
      chapterId,
      data,
      user.id // Kirim "Paspor"
    );

    return reply.status(200).send(updatedChapter);

  } catch (err: unknown) {
    // Error handling yang aman
    console.error('Error in updateChapterController (BFF):', err);
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

// ✅
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
 * ✅
 * (INI ADALAH FUNGSI BFF YANG "PINTAR")
 * Menangani pembaruan urutan semua chapter.
 * Ini adalah handler untuk: PATCH /:courseId/chapters/reorder
 */
export const reorderChaptersController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { courseId } = req.params as { courseId: string };

    // 1. Validasi Input (Logika Bisnis BFF)
    //    Kita validasi bahwa body adalah array yang benar
    const result = reorderChaptersSchema.safeParse(req.body);
    if (!result.success) {
      return reply
        .status(400)
        .send({ message: 'Invalid input: body must be an array of {id, order}', errors: result.error.flatten() });
    }
    const data = result.data; // [{id: "...", order: ...}, ...]

    // 2. Ambil User (Logika Bisnis BFF)
    const user = (req as any).user;
    if (!user || !user.id || !user.role) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    // 3. Validasi Kepemilikan (Logika Bisnis "Pintar" BFF)
    const isOwner = await validateCourseOwnership(user.id, courseId, user.role);
    if (!isOwner) {
      return reply.status(403).send({ message: 'Access Denied.' });
    }
    
    // 4. Panggil Go service "bodoh" (via service axios)
    const response = await reorderChaptersService(
      courseId,
      data,
      user.id // Kirim "Paspor"
    );

    return reply.status(200).send(response); // { message: "..." }

  } catch (err: unknown) {
    // Error handling yang aman
    console.error('Error in reorderChaptersController (BFF):', err);
    if (err instanceof Error) {
      if (err.message.includes('Forbidden')) {
         return reply.status(403).send({ message: err.message });
      }
      if (err.message.includes('not found')) {
         return reply.status(404).send({ message: err.message });
      }
      // Error 400 dari Go akan ditangkap di sini
      return reply.status(500).send({ message: err.message });
    }
    return reply.status(500).send({ message: 'An unknown error occurred' });
  }
};

// ✅
// (GET /:courseId/chapters)
export const getChaptersAndLessonsController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { courseId } = req.params as { courseId: string };
    const authId = (req as any).user?.id; // Diambil dari gateway
    const role = (req as any).user?.role; // Diambil dari gateway

    // 1. Panggil Go service "bodoh" (via service yang sudah ada)
    //    Ini memanggil GET /internal/courses/:id
    const course: CourseFromGo = await getCourseByIdService(courseId);

    // 2. Logika Bisnis "Pintar" (Akses)
    //    Logika ini identik dengan getCourseByIdController
    const isPublished = course.status === 'PUBLISHED';
    const isArchived = course.status === 'ARCHIVED';

    let canAccess = false;

    if (isPublished) {
      // Boleh dilihat semua orang
      canAccess = true;
    } else if (authId && role) {
      // Jika tidak dipublikasi, cek otorisasi
      if (role === 'admin') {
        canAccess = true;
      }
      // Cek kepemilikan Teacher
      else if (role === 'teacher' && course.teacherId === (await prisma.teacher.findUnique({ where: { authId } }))?.id) {
        canAccess = true;
      }
      // Cek kepemilikan Student (via Payment-service)
      else {
        const { isEnrolled } = await checkEnrollmentService(authId, course.id);
        if (isEnrolled && !isArchived) {
          canAccess = true;
        }
      }
    }

    // 3. Kembalikan data
    if (canAccess) {
      // Berhasil, tapi HANYA kembalikan chapters-nya
      return reply.send(course.chapters || []);
    }

    // Jika tidak lolos semua, 404
    return reply.status(404).send({ message: 'Course chapters not found' });

  } catch (err: unknown) {
    // Error handling yang aman
    console.error('Error in getChaptersAndLessonsController (BFF):', err);
    if (err instanceof Error) {
      if (err.message === 'Course not found') {
        return reply.status(404).send({ message: 'Course not found' });
      }
      return reply.status(500).send({ message: err.message });
    }
    return reply.status(500).send({ message: 'An unknown error occurred' });
  }
};

/**
 * ✅ 
 * (INI ADALAH FUNGSI BFF YANG "PINTAR")
 * Menangani penghapusan chapter.
 * Ini adalah handler untuk: DELETE /:courseId/chapters/:chapterId
 */
export const deleteChapterController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { courseId, chapterId } = req.params as { courseId: string; chapterId: string };

    // 1. Ambil User (Logika Bisnis BFF)
    const user = (req as any).user;
    if (!user || !user.id || !user.role) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    // 2. Validasi Kepemilikan (Logika Bisnis "Pintar" BFF)
    //    Kita tetap validasi di sini (fail-fast)
    const isOwner = await validateCourseOwnership(user.id, courseId, user.role);
    if (!isOwner) {
      return reply.status(403).send({ message: 'Access Denied.' });
    }
    
    // 3. Panggil Go service "bodoh" (via service axios)
    //    Go service akan melakukan verifikasi kedua DI DALAM transaksi
    //    dan menghapus semua lesson terkait.
    const response = await deleteChapterService(
      courseId,
      chapterId,
      user.id // Kirim "Paspor"
    );

    return reply.status(200).send(response); // { message: "..." }

  } catch (err: unknown) {
    // Error handling yang aman
    console.error('Error in deleteChapterController (BFF):', err);
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
