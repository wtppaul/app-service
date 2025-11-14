// src/controllers/course.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { z } from 'zod';
import { generateCourseSlug } from '../utils/slug';
import { prisma } from '../utils/prisma';
import {
  CourseStatus as EnumCourseStatus, 
  CourseLevel, 
  CourseLicense } from '../../generated/prisma';
import {
  createCourseService,
  updateCourseService,
  updateCourseStatusService,
  updateCoursePriceService,
  updateCourseTagsService,
  getAllCoursesService,
  getCourseBySlugService,
  getCourseByIdService,
  getCoursesITeachService,
  updateCourseStatusByIdService,
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
import { getCoursesByTeacherIdService } from '../services/course.service';
import { CourseFromGo, ChapterFromGo } from '../services/course.service'; 
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

// ✅
export const getAllCoursesController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const query = req.query as any;
    let isAdmin = false;
    let parsedFilters: any;

    // 1. Cek Token Admin (Logika Bisnis "Pintar")
    const token = req.cookies?.accessToken;
    if (token) {
      try {
        // (Asumsi gateway Anda akan menggantikan ini)
        // Untuk sekarang, kita cek manual
        const decoded = verifyToken(token);
        if (decoded && decoded.role === 'admin') {
          isAdmin = true;
        }
      } catch (e) {
        // Token tidak valid, abaikan, anggap sebagai publik
      }
    }

    // 2. Validasi Query (Logika Bisnis "Pintar")
    if (isAdmin) {
      // Admin boleh filter status apa saja
      const parsedAdmin = adminCourseQuerySchema.safeParse(query);
      if (!parsedAdmin.success) {
        return reply.status(400).send({
          message: 'Admin query invalid',
          details: parsedAdmin.error.flatten(),
        });
      }
      parsedFilters = parsedAdmin.data;
    } else {
      // Publik HANYA boleh lihat PUBLISHED
      const parsedPublic = publicCourseQuerySchema.safeParse(query);
      if (!parsedPublic.success) {
        return reply.status(400).send({
          message: 'Public query invalid',
          details: parsedPublic.error.flatten(),
        });
      }
      parsedFilters = parsedPublic.data;

      // ✅ LOGIKA BFF: Paksa filter status untuk publik
      parsedFilters.status = ['PUBLISHED'];
    }

    // 3. Ambil Paginasi
    const page = parsedFilters.page || DEFAULT_PAGE;
    const limit = parsedFilters.limit || DEFAULT_LIMIT;
    
    // Hapus properti paginasi dari filter sebelum dikirim ke Go
    delete parsedFilters.page;
    delete parsedFilters.limit;

    // 4. Panggil Go service "bodoh" (via service axios)
    // Kirim filter yang sudah divalidasi dan "dipaksa"
    const result = await getAllCoursesService({
      filters: parsedFilters,
      page: page,
      limit: limit,
    });

    // 5. Lakukan "Enrichment" (jika perlu)
    const enhancedData = result.data.map((course: CourseFromGo) => ({
      ...course,
      statusDescription: statusDescriptions[course.status] || course.status,
    }));

    return reply.code(200).send({
      data: enhancedData,
      pagination: result.pagination,
    });
  } catch (err: unknown) {
    // Error handling yang aman
    console.error('Error in getAllCoursesController (BFF):', err);
    if (err instanceof Error) {
      return reply.status(500).send({ message: err.message });
    }
    return reply.status(500).send({ message: 'An unknown error occurred' });
  }
};

// ✅ 
export const getAllCoursesByCategoryController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  // Cukup teruskan request-nya ke getAllCoursesController
  // karena Go service kita sudah bisa menangani filter 'category'
  
  // 1. Ambil query string
  const query = req.query as any;
  
  // 2. (PENTING) Ambil slug kategori dari query
  const categorySlug = query.categorySlug;
  const subCategorySlug = query.subCategorySlug;
  
  // 3. Set filter 'category' untuk diteruskan ke getAllCourses
  //    Go service kita mengharapkan param 'category'
  if (subCategorySlug) {
    query.category = subCategorySlug;
  } else if (categorySlug) {
    // TODO: Ini perlu logika lebih. Jika 'categorySlug' adalah kategori induk,
    // haruskah kita mencari semua sub-kategorinya?
    // Untuk saat ini, kita cari slug yang cocok saja.
    query.category = categorySlug; 
  }
  
  // Hapus slug lama agar tidak bentrok
  delete query.categorySlug;
  delete query.subCategorySlug;

  // 4. Panggil controller utama
  // (Kita mengganti req.query dengan 'query' kita yang sudah dimodifikasi)
  req.query = query;
  return getAllCoursesController(req, reply);
};

// ✅ 
export const getAllCoursesByTagController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  // Cukup teruskan request-nya ke getAllCoursesController
  // karena Go service kita sudah bisa menangani filter 'tag'
  
  // 1. Ambil query string
  const query = req.query as any;

  // 2. Ambil 'tag' dari query (Go service kita mengharapkan 'tag')
  const tagSlug = query.tag; // (Asumsi query-nya ?tag=nama-tag)

  // 3. Panggil controller utama
  return getAllCoursesController(req, reply);
};

// ✅
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
      
    // PERBAIKAN: 'course.status' sekarang BUKAN 'any'.
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

  } catch (error: unknown) { 
    console.error(error);
    
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

// ✅
export const getCourseByIdController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { courseId } = req.params as { courseId: string };
    const authId = (req as any).user?.id; // Diambil dari gateway
    const role = (req as any).user?.role; // Diambil dari gateway

    // 1. Panggil Go service "bodoh"
    const course: CourseFromGo = await getCourseByIdService(courseId);

    // 2. Logika "Enrichment" (BFF) - Sama persis dengan getBySlug
    const totalChapters = course.chapters ? course.chapters.length : 0;
    const totalLessons = course.chapters
      ? course.chapters.reduce(
          (sum: number, chapter: ChapterFromGo) => {
            return sum + (chapter.lessons ? chapter.lessons.length : 0);
          },
          0
        )
      : 0;
    const statusDescription =
      statusDescriptions[course.status] || course.status;

    const enhancedCourse = {
      ...course,
      totalChapters,
      totalLessons,
      statusDescription,
    };

    // 3. Logika Bisnis "Pintar" (Akses) - Sama persis dengan getBySlug
    const isPublished = course.status === 'PUBLISHED';
    const isArchived = course.status === 'ARCHIVED';

    if (isPublished) {
      return reply.send(enhancedCourse);
    }

    // --- Jika TIDAK dipublikasi ---
    if (!authId || !role) {
      return reply.status(403).send({ message: 'Access denied' });
    }
    if (role === 'admin') {
      return reply.send(enhancedCourse);
    }

    // Cek kepemilikan Teacher (BFF masih butuh Prisma untuk ini)
    if (role === 'teacher') {
      const teacher = await prisma.teacher.findUnique({ where: { authId } });
      if (teacher && teacher.id === course.teacherId) {
        return reply.send(enhancedCourse);
      }
    }

    // Cek kepemilikan Student (via Payment-service)
    const { isEnrolled } = await checkEnrollmentService(authId, course.id);
    if (isEnrolled && !isArchived) {
      return reply.send(enhancedCourse);
    }

    return reply.status(404).send({ message: 'Course not found' });
  } catch (err: unknown) {
    // Error handling yang aman
    console.error('Error in getCourseByIdController (BFF):', err);
    if (err instanceof Error) {
      if (err.message === 'Course not found') {
        return reply.status(404).send({ message: 'Course not found' });
      }
      return reply.status(500).send({ message: err.message });
    }
    return reply.status(500).send({ message: 'An unknown error occurred' });
  }
};

// ✅ 
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


// ✅
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

// ✅
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
    //    Hanya admin yang bisa mengedit kursus yang sudah diproses
    if (user.role !== 'admin') {
      const allowedStatuses = ['DRAFT', 'INCOMPLETE', 'FOLLOWED_UP', 'REJECTED'];
      if (!allowedStatuses.includes(course.status)) {
        return reply.code(403).send({
          message: `You cannot update a course in ${course.status} status.`,
        });
      }
    }
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
    const cleanStatus = sanitizeInput(req.body as { status: EnumCourseStatus });
    const { slug } = req.params as { slug: string };
    const { status } = cleanStatus;

    // Validasi status
    if (!Object.keys(EnumCourseStatus).includes(status)) {
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

// ✅ 
export const updateCourseStatusControllerPub = async (
  req: FastifyRequest<{
    Params: { courseId: string };
    Body: { status: EnumCourseStatus }; 
  }>,
  reply: FastifyReply
) => {
  try {
    const { courseId } = req.params;
    const { status } = req.body;
    
    // 1. Validasi Input (Logika Bisnis BFF)
    if (!Object.values(EnumCourseStatus).includes(status)) {
      return reply.status(400).send({ message: 'Invalid status value' });
    }

    // 2. Ambil User (Logika Bisnis BFF)
    const user = (req as any).user;
    if (!user || !user.id) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    // 3. Validasi Kepemilikan (Logika Bisnis BFF)
    // (Penting! Hanya pemilik atau admin yang boleh ubah status)
    const isOwner = await validateCourseOwnership(user.id, courseId, user.role);
    if (!isOwner) {
      return reply.status(403).send({ message: 'Access Denied.' });
    }

    // 4. Panggil Go service "bodoh"
    const updated = await updateCourseStatusByIdService(
      courseId, 
      status, 
      user.id
    );

    if (!updated) {
      return reply.status(404).send({ message: 'Course not found' });
    }

    return reply.status(200).send(updated);
  } catch (err: unknown) {
    // ... (Error handling yang aman) ...
    console.error('❌ updateCourseStatusController error:', err);
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
export const getCoursesITeachController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const user = (req as any).user;
    if (!user || !user.id) {
      return reply.status(401).send({ error: 'Unauthorized' });
    }
    
    // 1. Tukar "Paspor" (AuthID) dengan "Profil" (TeacherID)
    //    (BFF masih butuh Prisma untuk ini)
    const teacher = await prisma.teacher.findUnique({
      where: { authId: user.id },
    });
    if (!teacher) {
      return reply.status(404).send({ message: 'Teacher not found' });
    }

    // 2. Panggil Go service "bodoh"
    const courses: CourseFromGo[] = await getCoursesITeachService(
      { teacherId: teacher.id },
      user.id // Kirim "Paspor" untuk otorisasi di Go
    );

    // 3. Lakukan "Enrichment" (Hitung total, dll.)
    const enhancedCourses = courses.map((course) => ({
      ...course,
      totalChapters: course.chapters ? course.chapters.length : 0,
      totalLessons: course.chapters
        ? course.chapters.reduce(
            (sum: number, chapter: ChapterFromGo) => {
              return sum + (chapter.lessons ? chapter.lessons.length : 0);
            }, 0)
        : 0,
      statusDescription:
        statusDescriptions[course.status] || course.status,
    }));

    return reply.send(enhancedCourses);
  } catch (err: unknown) {
    // ... (Error handling yang aman) ...
    console.error('Error in getCoursesITeachController (BFF):', err);
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

// export const unpublishCourseController = async (
//   req: FastifyRequest,
//   reply: FastifyReply
// ) => {
//   const { slug } = req.params as { slug: string };

//   try {
//     const updated = await updateCourseStatusService(slug, 'UNPUBLISHED');
//     if (!updated) {
//       return reply.code(404).send({ message: 'Course not found' });
//     }

//     return reply.code(200).send(updated);
//   } catch (err) {
//     console.error('Unpublish error:', err);
//     return reply.code(500).send({ message: 'Failed to unpublish course' });
//   }
// };

// ✅ 
export const updateCourseTagsController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { slug } = req.params as { slug: string };
    const { tagIds } = req.body as { tagIds: string[] };

    // 1. Validasi Input (Logika Bisnis BFF)
    if (!Array.isArray(tagIds)) {
      return reply.status(400).send({ message: 'tagIds must be an array' });
    }

    // 2. Ambil User (Logika Bisnis BFF)
    const user = (req as any).user;
    if (!user || !user.id) {
      return reply.status(401).send({ message: 'Unauthorized' });
    }

    // 3. Validasi Kepemilikan (Logika Bisnis BFF)
    const course = await prisma.course.findUnique({ where: { slug } });
    if (!course) {
      return reply.status(404).send({ message: 'Course not found' });
    }
    
    const isOwner = await validateCourseOwnership(user.id, course.id, user.role);
    if (!isOwner) {
       return reply.status(403).send({ message: 'Access Denied.' });
    }

    // 4. Panggil Go service "bodoh"
    const result = await updateCourseTagsService(course.id, tagIds, user.id);
    return reply.code(200).send(result);
  } catch (err: unknown) {
    // Error handling yang aman
    console.error('Error in updateCourseTagsController (BFF):', err);
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

