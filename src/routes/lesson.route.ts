// src/routes/lesson.route.ts
import { FastifyPluginAsync } from 'fastify';
import { authorize } from '../utils/authorize';
import { lessonAuthorize } from '../utils/lessonAuthorize';
import { authenticate } from '../utils/authenticate';
import {
  updateLessonController,
  deleteLessonController,
  getLessonDurationByIdController,
  getLessonController,
} from '../controllers/lesson.controller';
import { getSignedLessonUrlController } from '../controllers/getSignedLessonUrl.controller';

const lessonRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/:lessonId/course/:courseId', {
    preHandler: [
      lessonAuthorize(['student', 'teacher', 'admin'], { allowPreview: true }),
    ],
    handler: getSignedLessonUrlController,
  });

  fastify.get('/duration/:lessonId', {
    preHandler: [authorize(['admin', 'teacher'])],
    handler: getLessonDurationByIdController,
  }); // ✅ DONE
  fastify.get('/:id', {
    preHandler: [authorize(['teacher', 'admin'])],
    handler: getLessonController,
  });
  fastify.patch('/:id', {
    preHandler: [authorize(['admin', 'teacher'])],
    handler: updateLessonController,
  });

  fastify.delete('/:id', {
    preHandler: [authorize(['admin', 'teacher'])],
    handler: deleteLessonController,
  });
};

export default lessonRoute;
