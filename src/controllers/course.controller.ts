// src/controllers/course.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { generateCourseSlug } from '../utils/slug';
import { prisma } from '../utils/prisma';
import { CourseStatus } from '../../generated/prisma';
import {
  createCourseService,
  updateCourseService,
  updateCourseStatusService,
  updateCoursePriceService,
  updateCourseTagsService,
  getAllCoursesService,
  getCourseBySlugService,
  getCourseByIdService,
  getAllCoursesByCategoryService,
  getAllCoursesByTagService,
  getCoursesITeachService,
} from '../services/course.service';
import { statusDescriptions } from '../config/types/courseStatus';
import { CourseCreateData, CourseUpdateData } from '../config/types/course';
import { createCourseSchema, updateCourseSchema } from '../config/schemas/course.schema';
import { parseQueryParams } from '../utils/queryParser'; // Optional, untuk parse query params
import { verifyToken } from '../utils/jwt';
import { ZodError } from 'zod';
import {
  publicCourseQuerySchema,
  adminCourseQuerySchema,
} from '../config/schemas/courseQuery.schema';
import sanitizeInput from '../utils/xInputSanitize';
import { validateCourseOwnership } from '../utils/validateAccess';
import { updateCourseStatusById } from '../services/course.service';
import { getCoursesByTeacherIdService } from '../services/course.service';
import { CourseFromGo } from '../services/course.service'; 
import { checkEnrollmentService } from '../services/payment.service';

const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 11;
// const statusDescriptions: { [key in CourseStatus]?: string } = {
//   DRAFT: 'Course just created. No content yet.',
//   INCOMPLETE: 'Awaiting submission. Please complete and submit for review.',
//   PENDING_REVIEW: 'Submitted and waiting for admin review.',
//   FOLLOWED_UP: 'Admin sent feedback. Please respond.',
//   APPROVED: 'Approved by admin. Waiting to be published.',
//   PUBLISHED: 'Published and publicly visible.',
//   REJECTED: 'Rejected by admin. See feedback.',
//   UNPUBLISHED: 'Temporarily removed from public view.',
//   ARCHIVED: 'Deprecated course. No longer maintained.',
// };

//  /api/courses?status=PUBLISHED,APPROVED
export const getAllCoursesController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const query = req.query as { query: string };

    let isAdmin = false;

    // 1. Validasi apakah query cocok dengan public schema
    const parsedPublic = publicCourseQuerySchema.safeParse(query);
    console.log('PARSE FILTER:PUB : ', parsedPublic);
    if (!parsedPublic.success) {
      // 2. Jika bukan akses publik, validasi token
      const token = req.cookies?.accessToken;
      if (!token) {
        return reply.status(404).send({
          message:
            'Oopsie! The page took a little vacation.  Let’s get you back on track.',
        });
      }

      const decoded = verifyToken(token);
      if (!decoded || decoded.role !== 'admin') {
        return reply.status(404).send({
          message:
            'You’ve discovered a secret place... oh wait, it’s just a missing page.',
        });
      }

      isAdmin = true;

      // 3. Validasi query sebagai admin
      const parsedAdmin = adminCourseQuerySchema.safeParse(query);
      console.log('PARSE FILTER:ADM : ', parsedAdmin);
      if (!parsedAdmin.success) {
        return reply.status(400).send({
          message: 'Oops! Looks like you’ve wandered off the map.',
          details: parsedAdmin.error.flatten(),
        });
      }
    }

    const filters = parseQueryParams(query);
    const result = await getAllCoursesService({
      filters,
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
    });

    return reply.code(200).send(result);
  } catch (err) {
    if (err instanceof ZodError) {
      return reply.status(400).send({
        message: 'Oops! Looks like you’ve wandered off the map...',
        details: err.flatten(),
      });
    }

    console.error('Error in getAllCoursesController:', err);
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

// --- EDIT DENGAN ERROR HANDLING YANG BENAR ---
export const getCourseBySlugController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { slug } = req.params as { slug: string };

    const course: CourseFromGo = await getCourseBySlugService(slug);

    if (!course) {
      return reply.status(404).send({ message: 'Course not found' });
    }

    const totalChapters = course.chapters ? course.chapters.length : 0;
    const totalLessons = course.chapters
      ? course.chapters.reduce(
          (sum: number, chapter: { lessons: any[] | null }) => {
            return sum + (chapter.lessons ? chapter.lessons.length : 0);
          }, 0
        ) 
      : 0;
      
    // ✅ PERBAIKAN: 'course.status' sekarang BUKAN 'any'.
    // Ini adalah tipe 'EnumCourseStatus' (alias 'CourseStatus').
    // Error 'ts(7053)' akan hilang.
    const statusDescription = statusDescriptions[course.status] || course.status;
    
    const enhancedCourse = {
      ...course,
      totalChapters,
      totalLessons,
      statusDescription,
    };
  
    // --- (LOGIKA BISNIS ANDA SUDAH BENAR) ---
    const isPublished = course.status === 'PUBLISHED';
    const isArchived = course.status === 'ARCHIVED';

    if (isPublished) {
      return reply.send(enhancedCourse);
    }
    const authId = (req as any).user?.id; 
    const role = (req as any).user?.role;
    if (!authId || !role) {
      return reply.status(403).send({ message: 'Access denied' });
    }
    if (role === 'admin') {
      return reply.send(enhancedCourse);
    }
    if (role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({ where: { authId } });
      if (teacher && teacher.id === course.teacherId) {
        return reply.send(enhancedCourse); 
      }
    }
    const { isEnrolled } = await checkEnrollmentService(authId, course.id); 
    if (isEnrolled && !isArchived) {
      return reply.send(enhancedCourse); 
    }
    return reply.status(404).send({ message: 'Course not found' });
    // --- (AKHIR LOGIKA BISNIS) ---

  } catch (error: unknown) { // ✅ Tipe 'error' adalah 'unknown'
    console.error(error);
    
    // ✅ Kita periksa tipe error-nya
    if (error instanceof Error) {
      if (error.message === 'Course not found') {
        return reply.status(404).send({ message: 'Course not found' });
      }
      return reply.status(500).send({ message: error.message });
    }
    
    // Fallback
    return reply.status(500).send({ message: 'An unknown internal error occurred' });
  }
};
// --- AKHIR EDIT ---

/**
 *
 * api/courses/category?status=PUBLISHED&categorySlug=jewelry-making-wire-resin-metal-clay
 * api/courses/category?status=PUBLISHED
 *
 */
export const getCourseByIdController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { courseId } = req.params as { courseId: string };

    const course = await getCourseByIdService(courseId);

    if (!course) {
      return reply.status(404).send({ message: 'Course not found' });
    }

    // Jika course BELUM PUBLISHED, hanya admin atau teacher yang membuatnya yang boleh lihat
    if (course.status !== 'PUBLISHED') {
      const cleanInput = req.cookies?.accessToken;
      const token = cleanInput;
      if (!token) {
        return reply.status(403).send({ message: 'Access denied' });
      }

      const decoded = verifyToken(token);
      const authId = decoded?.id;
      const role = decoded?.role;

      // Admin boleh akses
      if (role === 'admin') {
        return reply.send(course);
      }

      // Teacher harus cocok dengan teacherId course
      if (role === 'teacher') {
        const teacher = await prisma.teacher.findUnique({
          where: { authId },
        });

        if (!teacher || teacher.id !== course.teacherId) {
          return reply.status(403).send({ message: 'Access denied' });
        }

        console.log(
          'teacherAuthId :: ',
          teacher.id,
          ' -- courseTeacherId :: ',
          course.teacherId
        );

        return reply.send(course);
      }

      // Role lain tidak boleh akses
      return reply.status(403).send({ message: 'Access denied' });
    }

    // Course sudah PUBLISHED, semua boleh lihat
    return reply.send(course);
  } catch (error) {
    console.error(error);
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const getCoursesByTeacherIdController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { teacherId } = req.params as { teacherId: string };

    const courses = await getCoursesByTeacherIdService(teacherId);
    if (!courses) {
      return reply.status(404).send({ message: 'Courses not found' });
    }

    let role = null;
    let authId = null;

    const token = req.cookies?.accessToken;
    if (token) {
      try {
        const decoded = verifyToken(token);
        authId = decoded?.id;
        role = decoded?.role;
      } catch {
        // Token invalid, treat as guest
      }
    }

    const teacher = await prisma.teacher.findUnique({
      where: { id: teacherId },
    });

    if (!teacher) {
      return reply.status(404).send({ message: 'Teacher not found' });
    }

    const isSelf = role === 'teacher' && teacher.authId === authId;

    const filtered = courses.filter((c) => {
      if (c.status === 'PUBLISHED') return true;
      if (role === 'admin') return true;
      if (isSelf) return true;
      return false;
    });

    return reply.send(filtered);
  } catch (err) {
    console.error(err);
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const getAllCoursesByCategoryController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const query = req.query as { query: string };

    let isAdmin = false;

    // 1. Validasi apakah query cocok dengan public schema
    const parsedPublic = publicCourseQuerySchema.safeParse(query);
    console.log('PARSE FILTER:PUB : ', parsedPublic);
    if (!parsedPublic.success) {
      // 2. Jika bukan akses publik, validasi token
      const cleanInput = req.cookies?.accessToken;
      const token = cleanInput;
      if (!token) {
        return reply.status(404).send({
          message:
            'Oopsie! The page took a little vacation.  Let’s get you back on track.',
        });
      }

      const decoded = verifyToken(token);
      if (!decoded || decoded.role !== 'admin') {
        return reply.status(404).send({
          message:
            'You’ve discovered a secret place... oh wait, it’s just a missing page.',
        });
      }

      isAdmin = true;

      // 3. Validasi query sebagai admin
      const parsedAdmin = adminCourseQuerySchema.safeParse(query);
      console.log('PARSE FILTER:ADM : ', parsedAdmin);
      if (!parsedAdmin.success) {
        return reply.status(400).send({
          message: 'Oops! Looks like you’ve wandered off the map.',
          details: parsedAdmin.error.flatten(),
        });
      }
    }

    const filters = parseQueryParams(query);
    const result = await getAllCoursesByCategoryService({
      filters,
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
    });

    return reply.code(200).send(result);
  } catch (err) {
    if (err instanceof ZodError) {
      return reply.status(400).send({
        message: 'Oops! Looks like you’ve wandered off the map...',
        details: err.flatten(),
      });
    }

    console.error('Error in getAllCoursesController:', err);
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const getAllCoursesByTagController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    console.log('RAW QUERY:', req.query as { query: string });
    const query = req.query as { query: string };
    console.log('FILTERS-sanitized:', query);
    let isAdmin = false;

    // 1. Validasi apakah query cocok dengan public schema
    const parsedPublic = publicCourseQuerySchema.safeParse(query);
    console.log('PARSE FILTER:PUB : ', parsedPublic);
    if (!parsedPublic.success) {
      // 2. Jika bukan akses publik, validasi token
      const token = req.cookies?.accessToken;
      if (!token) {
        return reply.status(404).send({
          message:
            'Oopsie! The page took a little vacation.  Let’s get you back on track.',
        });
      }

      const decoded = verifyToken(token);
      if (!decoded || decoded.role !== 'admin') {
        return reply.status(404).send({
          message:
            'You’ve discovered a secret place... oh wait, it’s just a missing page.',
        });
      }

      isAdmin = true;

      // 3. Validasi query sebagai admin
      const parsedAdmin = adminCourseQuerySchema.safeParse(query);
      console.log('PARSE FILTER:ADM : ', parsedAdmin);
      if (!parsedAdmin.success) {
        return reply.status(400).send({
          message: 'Oops! Looks like you’ve wandered off the map.',
          details: parsedAdmin.error.flatten(),
        });
      }
    }

    const filters = parseQueryParams(query); // jika mau, bisa pakai parsedPublic.data atau parsedAdmin.data
    const result = await getAllCoursesByTagService({
      filters,
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
    });
    console.log('FILTERS:', filters);
    return reply.code(200).send(result);
  } catch (err) {
    if (err instanceof ZodError) {
      return reply.status(400).send({
        message: 'Oops! Looks like you’ve wandered off the map...',
        details: err.flatten(),
      });
    }

    console.error('Error in getAllCoursesController:', err);
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const createCourseController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  // 1. Validasi Zod (Logika Bisnis BFF)
  const result = createCourseSchema.safeParse(req.body);
  if (!result.success) {
    return reply
      .status(400)
      .send({ message: 'Invalid input', errors: result.error.flatten() });
  }
  const data = result.data;

  // 2. Ambil AuthID dari Gateway
  const user = (req as any).user;
  if (!user || !user.id) {
    return reply.status(401).send({ message: 'Unauthorized' });
  }

  try {
    // 3. Panggil Go service "bodoh" (via service axios)
    // BFF hanya mengirim 'title'
    // Go service akan menangani:
    // - Generate slug
    // - FindOrCreateTeacher (via AuthID dari header)
    // - Menyimpan ke DB
    const course = await createCourseService(data, user.id);

    reply.status(201).send(course);
  } catch (err: unknown) {
    // Error handling aman
    if (err instanceof Error) {
      return reply.status(500).send({ message: err.message });
    }
    reply.status(500).send({ message: 'An unknown error occurred' });
  }
};

// ✅ --- FUNGSI INI SEKARANG DIPERBAIKI ---
export const updateCourseController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { slug } = req.params as { slug: string }; // 👈 Kita pakai SLUG untuk mencari
    
    // 1. Validasi Input (Logika Bisnis BFF)
    const result = updateCourseSchema.safeParse(req.body);
    if (!result.success) {
      return reply
        .status(400)
        .send({ message: 'Invalid input', errors: result.error.flatten() });
    }
    const data = result.data; // Data bersih (title, description, dll)

    // 2. Ambil User (Logika Bisnis BFF)
    const user = (req as any).user;
    if (!user || !user.id) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    // 3. Cek Kepemilikan (Logika Bisnis BFF)
    //    Kita masih butuh Prisma di BFF untuk cek kepemilikan
    const course = await prisma.course.findUnique({ where: { slug } });
    if (!course) {
      return reply.code(404).send({ message: 'Course not found' });
    }

     // ✅ Validasi: hanya teacher yg punya course & status tertentu boleh update
    const allowedStatuses = ['DRAFT', 'INCOMPLETE', 'FOLLOWED_UP'];
    if (!allowedStatuses.includes(course.status)) {
      return reply.code(403).send({
        message: `You cannot update a course in ${course.status} status.`,
      });
    }

    const teacher = await prisma.teacher.findUnique({
      where: { authId: user.id },
    });
    if (!teacher) {
      return reply.status(404).send({ message: 'Teacher not found' });
    }

    if (course.teacherId !== teacher.id && user.role !== 'admin') {
      return reply.code(403).send({
        message: 'You are not allowed to update this course.',
      });
    }

    // 4. ✅ PERBAIKAN BUG: JANGAN buat slug baru
    // ⛔️ HAPUS: dataResult.slug = generateCourseSlug(dataResult.title, user.username);
    // Go service akan mengabaikan slug, kita hanya kirim data.
    
    // 5. Panggil Go service "bodoh"
    const updated = await updateCourseService(
      course.id, // 👈 Kirim ID (UUID)
      data,      // 👈 Kirim data input (title, desc, dll)
      user.id    // 👈 Kirim AuthID (Paspor)
    );

    return reply.code(200).send(updated);
  } catch (err: unknown) {
    // Error handling yang aman
    console.error('Error in updateCourseController (BFF):', err);
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

export const updateCourseStatusController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const cleanStatus = sanitizeInput(req.body as { status: CourseStatus });
    const { slug } = req.params as { slug: string };
    const { status } = cleanStatus;

    // Validasi status
    if (!Object.keys(CourseStatus).includes(status)) {
      return reply.code(400).send({ message: 'Invalid course status' });
    }

    const updated = await updateCourseStatusService(slug, status);

    if (!updated) {
      return reply.code(404).send({ message: 'Course not found' });
    }

    return reply.code(200).send(updated);
  } catch (err) {
    console.error('Update course status error:', err);
    return reply.code(500).send({ message: 'Failed to update course status' });
  }
};

export const updateCourseStatusControllerPub = async (
  req: FastifyRequest<{
    Params: { courseId: string };
    Body: { status: CourseStatus };
  }>,
  reply: FastifyReply
) => {
  try {
    const { courseId } = req.params as { courseId: string };
    const { status } = sanitizeInput(req.body);
    const course = await prisma.course.findUnique({ where: { id: courseId } });

    if (!course) {
      return reply.status(404).send({ message: 'Course not found' });
    }
    if (!Object.values(CourseStatus).includes(status)) {
      return reply.status(400).send({ message: 'Invalid status value' });
    }

    const user = (req as any).user;
    const isOwner = await validateCourseOwnership(user.id, courseId, user.role);
    const editableStatuses = ['DRAFT', 'INCOMPLETE', 'FOLLOWED_UP'];
    const isEditable =
      course && editableStatuses.includes(course.status) && isOwner;

    if (!isEditable) {
      return reply.status(403).send({ message: 'Access Denied.' });
    }
    const updated = await updateCourseStatusById(courseId, status);
    if (!updated) {
      return reply.status(404).send({ message: 'Course not found' });
    }

    return reply.status(200).send(updated);
  } catch (err) {
    console.error('❌ updateCourseStatusController error:', err);
    return reply.status(500).send({ message: 'Failed to update status' });
  }
};

export const unpublishCourseController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  const { slug } = req.params as { slug: string };

  try {
    const updated = await updateCourseStatusService(slug, 'UNPUBLISHED');
    if (!updated) {
      return reply.code(404).send({ message: 'Course not found' });
    }

    return reply.code(200).send(updated);
  } catch (err) {
    console.error('Unpublish error:', err);
    return reply.code(500).send({ message: 'Failed to unpublish course' });
  }
};

export const updateCourseTagsController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const cleanTag = req.body as { tagIds: string[] };
    const { slug } = req.params as { slug: string };
    const { tagIds } = cleanTag;

    if (!slug) {
      return reply.status(400).send({ message: 'slug is required' });
    }

    if (!Array.isArray(tagIds)) {
      return reply.status(400).send({ message: 'tagIds must be an array' });
    }

    const course = await prisma.course.findUnique({ where: { slug } });
    if (!course) {
      return reply.status(404).send({ message: 'Course not found' });
    }

    const updated = await updateCourseTagsService(course.id, tagIds);
    return reply.code(200).send(updated);
  } catch (err) {
    console.error('Error updating course tags:', err);
    return reply.status(500).send({ message: 'Failed to update tags' });
  }
};

export const updateCoursePriceController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const cleanPrice = sanitizeInput(req.body as { price: number });
    const { slug } = req.params as { slug: string };
    const { price } = cleanPrice;

    const updated = await updateCoursePriceService(slug, price);

    if (!updated) {
      return reply.code(404).send({ message: 'Course not found' });
    }

    return reply.code(200).send(updated);
  } catch (err) {
    console.error('Update course price error:', err);
    return reply.code(500).send({ message: 'Failed to update course price' });
  }
};

export const getCoursesITeachController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const user = (req as any).user;

    if (!user || !user.id) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    const teacher = await prisma.teacher.findUnique({
      where: { authId: user.id },
    });
    if (!teacher) {
      return reply.status(404).send({ message: 'Teacher not found' });
    }
    console.log('sdxjgh', teacher.id);
    const courses = await getCoursesITeachService({
      teacherId: teacher.id,
    });

    if (!courses) {
      return reply.status(404).send({ message: 'Course not found' });
    }
    console.log('sdxjgh2', courses);
    return reply.send(courses);
  } catch (error) {
    console.error('Error fetching courses I teach:', error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};
