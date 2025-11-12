// src/routes/course.route.ts
import { FastifyPluginAsync } from 'fastify';
import { authorize } from '../utils/authorize';
import {
  createCourseController,
  updateCourseController,
  getAllCoursesController,
  getCourseBySlugController,
  getAllCoursesByCategoryController,
  getAllCoursesByTagController,
  updateCourseStatusController,
  updateCourseStatusControllerPub,
  getCourseByIdController,
  getCoursesByTeacherIdController,
} from '../controllers/course.controller';
import {
  updateChapterController,
  reorderChaptersController,
  getChaptersAndLessonsController,
  createChapterWithLessonsController,
  deleteChapterController,
  addChapterToCourseController,
} from '../controllers/chapter.controller';
import { dashMiddleware } from '../middlewares/dashMiddleware';

const courseRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/', getAllCoursesController); // ✅ DONE
  fastify.get('/category', getAllCoursesByCategoryController); // ✅ DONE
  fastify.get('/by-tag', getAllCoursesByTagController); // ✅ DONE
  fastify.get('/:slug', getCourseBySlugController); // ✅ DONE
  fastify.get('/:courseId/structure', getCourseByIdController); // ✅ DONE
  fastify.get('/teacher/:teacherId', getCoursesByTeacherIdController); // ✅ DONE

  fastify.post('/', {
    preHandler: [dashMiddleware(['teacher', 'admin'])],
    handler: createCourseController,
  }); // ✅ DONE

  fastify.put('/:slug', {
    preHandler: authorize(['teacher', 'admin']),
    handler: updateCourseController,
  }); // ✅ DONE

  // CHAPTER ROUTES

  fastify.post('/:courseId/chapters', {
    preHandler: [authorize(['teacher', 'admin'])],
    handler: createChapterWithLessonsController,
  }); // ✅ DONE

  fastify.post('/:courseId/add-chapters', {
    preHandler: [authorize(['teacher', 'admin'])],
    handler: addChapterToCourseController,
  }); // ✅ DONE

  fastify.patch('/:courseId/chapters/:chapterId', {
    preHandler: [authorize(['teacher', 'admin'])],
    handler: updateChapterController,
  }); // ✅ DONE

  fastify.patch('/:courseId/chapters/reorder', {
    preHandler: [authorize(['teacher', 'admin'])],
    handler: reorderChaptersController,
  }); // ✅ DONE

  fastify.delete('/:courseId/chapters/:chapterId', {
    preHandler: [authorize(['teacher', 'admin'])],
    handler: deleteChapterController,
  }); // ✅ DONE

  fastify.get('/:courseId/chapters', getChaptersAndLessonsController); // ✅ DONE
};

export default courseRoute;
