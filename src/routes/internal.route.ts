// src/routes/course.route.ts
import { FastifyPluginAsync } from 'fastify';
import { internalBridgeGuard } from '../middlewares/internalBridgeGuard';
import { authorize } from '../utils/authorize';
import {
  getStatsPerCategoryController,
  getStatsPerTagController,
  getStatsCategoryTeachersController,
  getStatsTagTeachersController,
} from '../controllers/stats.controller';
import {
  updateCourseStatusController,
  updateCoursePriceController,
  getAllCoursesController,
  getCourseBySlugController,
  unpublishCourseController,
  updateCourseTagsController,
} from '../controllers/course.controller';
import { checkEnrollmentController } from '../controllers/enrollment.controller';

const internalRoute: FastifyPluginAsync = async (fastify) => {
  /**
   *
   * COURSES: PUBLISH, UNPUBLISH, TAGGING, PRICING
   *
   */
  fastify.patch('/courses/:slug/status', {
    preHandler: authorize(['admin']),
    handler: updateCourseStatusController,
  }); // ✅ DONE

  fastify.patch('/courses/:slug/price', {
    preHandler: [internalBridgeGuard, authorize(['admin'])],
    handler: updateCoursePriceController,
  }); // ✅ DONE

  fastify.patch('/courses/:slug/unpublish', {
    preHandler: authorize(['admin']),
    handler: unpublishCourseController,
  }); // ✅ DONE

  fastify.patch('/courses/:slug/tags', {
    preHandler: authorize(['admin']),
    handler: updateCourseTagsController,
  }); // ✅ DONE

  fastify.get(
    '/enrollment/user/:username/course/:courseSlug',
    { preHandler: [authorize(['admin'])] },
    checkEnrollmentController
  ); // ✅ DONE

  // fastify.delete('/:slug', {
  //   preHandler: authorize(['teacher', 'admin']),
  //   handler: deleteCourseController,
  // });

  /**
   *
   * STATISTIK: Cat, Tag, Teacher
   *
   */
  fastify.get('/stats/category', {
    preHandler: [internalBridgeGuard],
    handler: getStatsPerCategoryController,
  }); // ✅ DONE

  fastify.get('/stats/tag', {
    // preHandler: [internalBridgeGuard],
    handler: getStatsPerTagController,
  }); // ✅ DONE

  fastify.get('/stats/category/teachers', {
    // preHandler: [internalBridgeGuard],
    handler: getStatsCategoryTeachersController,
  }); // ✅ DONE

  fastify.get('/stats/tag/teachers', {
    // preHandler: [internalBridgeGuard],
    handler: getStatsTagTeachersController,
  }); // ✅ DONE
};

export default internalRoute;
