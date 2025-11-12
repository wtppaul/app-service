// src/routes/course.route.ts
import { FastifyPluginAsync } from 'fastify';
import { authorize } from '../utils/authorize';
import { syncUserController } from '../controllers/user.controller';
import {
  getCourseBySlugController,
  getCoursesITeachController,
  updateCourseStatusControllerPub,
} from '../controllers/course.controller';
import { dashMiddleware } from '../middlewares/dashMiddleware';
import {
  checkEnrollmentController,
  getMyCoursesController,
} from '../controllers/enrollment.controller';

const dashboardRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/me', {
    preHandler: dashMiddleware(['teacher', 'student', 'admin']),
    handler: syncUserController,
  }); // ✅ DONE

  fastify.get('/learns', {
    preHandler: dashMiddleware(['teacher', 'student', 'admin']),
    handler: getMyCoursesController,
  }); // ✅ DONE

  fastify.get('/courses/:slug', {
    preHandler: dashMiddleware(['teacher', 'student', 'admin']),
    handler: getCourseBySlugController,
  }); // ✅ DONE

  fastify.get('/teaches', {
    preHandler: [authorize(['teacher', 'admin'])],
    handler: getCoursesITeachController,
  });

  fastify.get(
    '/enrollment/user/:username/course/:courseSlug',
    { preHandler: [authorize(['teacher', 'admin'])] },
    checkEnrollmentController
  ); // ✅ DONE

  fastify.patch('/courses/:courseId/status', {
    preHandler: [authorize(['teacher', 'admin'])],
    handler: updateCourseStatusControllerPub,
  }); // ✅ DONE
};

export default dashboardRoute;
