// src/routes/course.route.ts
import { FastifyPluginAsync } from 'fastify';
import { authorize } from '../utils/authorize';
import { authenticate } from '../utils/authenticate';
import {
  createCourseController,
  updateCourseController,
  updateCourseStatusController,
  getAllCoursesController,
  getCourseBySlugController,
  getAllCoursesByCategoryController,
  getAllCoursesByTagController,
  unpublishCourseController,
  updateCourseTagsController,
} from '../controllers/course.controller';
import {
  enrollCourseController,
  getMyCoursesController,
} from '../controllers/enrollment.controller';

const enrollmentRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post(
    '/:courseId/enroll',
    { preHandler: [authorize(['student', 'teacher'])] },
    enrollCourseController
  ); // ✅ DONE digunakan oleh Midtrans webhook untuk daftarkan user

  fastify.get(
    '/my-courses',
    { preHandler: [authorize(['student', 'teacher'])] },
    getMyCoursesController
  ); // ✅ DONE
};

export default enrollmentRoute;
