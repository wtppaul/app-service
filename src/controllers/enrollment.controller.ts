import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../utils/prisma';
import { Role } from '../../generated/prisma';
import {
  checkEnrollmentService,
  getMyCoursesService,
} from '../services/enrollment.service';
import { findUserByUsername } from '../utils/findUserByUsername';

export const enrollCourseController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { courseId } = req.params as { courseId: string };
    const user = (req as any).user; // isi: { id, role }

    const roleMap: Record<string, Role> = {
      student: 'STUDENT',
      teacher: 'TEACHER',
    };

    const userRole = roleMap[user.role];

    if (!userRole || !['STUDENT', 'TEACHER'].includes(userRole)) {
      return reply.status(403).send({ message: 'Unauthorized role' });
    }

    const course = await prisma.course.findUnique({ where: { id: courseId } });
    if (!course) {
      return reply.status(404).send({ message: 'Course not found' });
    }

    // Ambil teacherId dari authId user
    const teacher = await prisma.teacher.findUnique({
      where: { authId: user.id },
    });

    // if (teacher && teacher.id === course.teacherId) {
    //   return reply
    //     .status(400)
    //     .send({ message: 'You cannot enroll in your own course' });
    // }

    const existing = await prisma.enrollment.findUnique({
      where: {
        authId_courseId: {
          authId: user.id,
          courseId: courseId,
        },
      },
    });

    if (existing) {
      return reply.status(400).send({ message: 'Already enrolled' });
    }

    const enrollment = await prisma.enrollment.create({
      data: {
        authId: user.id,
        userRole,
        courseId: courseId,
      },
    });

    reply.status(201).send(enrollment);
  } catch (err) {
    console.error(err);
    reply.status(500).send({ message: 'Failed to enroll' });
  }
};

// GET /int/enrollment/status?courseId=xxx
export const checkEnrollmentController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { courseSlug, username } = req.params as {
      courseSlug: string;
      username: string;
    };

    console.log('Looking for user:', username);
    const user = await findUserByUsername(username);
    if (!user) {
      return reply.status(404).send({ message: 'User not found' });
    }

    const course = await prisma.course.findUnique({
      where: { slug: courseSlug },
    });

    if (!course) {
      return reply.status(404).send({ message: 'Course not found' });
    }

    const enrollment = await checkEnrollmentService(user.authId, course.id);

    if (!enrollment) {
      return reply.status(403).send({ message: 'Forbidden' });
    }

    return reply.send({ enrolled: true });
  } catch (err) {
    console.error(err);
    return reply
      .status(500)
      .send({ message: 'Failed to check enrollment status' });
  }
};

/**
 * GET /api/enrollment/my-courses?page=1&limit=10&search=Ilustrasi&categoryId=cd50a428-0b04-4d22-97af-fa1cfce6e702
 * GET /api/enrollment/my-courses?page=1&limit=10&categoryId=cd50a428-0b04-4d22-97af-fa1cfce6e702
 *
 */

// GET /api/enrollment/my-courses

// Konfigurasi backend (bisa kamu ubah sesuai kebutuhan)
const DEFAULT_PAGE = 1;
const DEFAULT_LIMIT = 10;

export const getMyCoursesController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { search, categoryId } = req.query as {
      search?: string;
      categoryId?: string;
    };

    const userId = (req as any).user.id;

    const result = await getMyCoursesService({
      userId,
      page: DEFAULT_PAGE,
      limit: DEFAULT_LIMIT,
      search: search || '',
      categoryId,
    });

    return reply.status(200).send(result);
  } catch (err) {
    console.error(err);
    return reply.status(500).send({ message: 'Failed to fetch courses' });
  }
};
