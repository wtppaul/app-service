// src/routes/chapter.route.ts
import { FastifyPluginAsync } from 'fastify';
import { authorize } from '../utils/authorize';
import { authenticate } from '../utils/authenticate';
import {
  addLessonToChapterController,
  reorderLessonsController,
  createEmptyLesson,
} from '../controllers/lesson.controller';

const chapterRoute: FastifyPluginAsync = async (fastify) => {
  fastify.post('/:chapterId/lessons', {
    preHandler: [authorize(['teacher', 'admin'])],
    handler: createEmptyLesson,
  });
  fastify.patch('/:id/lessons/reorder', reorderLessonsController);
};

export default chapterRoute;
