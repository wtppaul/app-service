import { FastifyPluginAsync } from 'fastify';
import { authorize } from '../utils/authorize';
import {
  addLoveToCourseController,
  removeLoveFromCourseController,
  checkCourseLoveController,
  addLoveToUserController,
  removeLoveFromUserController,
  getUserLovesController,
  checkUserLoveController,
  getCourseLoveCountController,
} from '../controllers/love.controller';

const loveRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get('/course/count/:courseId', getCourseLoveCountController);

  fastify.get('/course/check', {
    preHandler: [authorize(['admin', 'teacher', 'student'])],
    handler: checkCourseLoveController,
  });

  // POST
  fastify.post('/course', {
    preHandler: [authorize(['admin', 'teacher', 'student'])],
    handler: addLoveToCourseController,
  });

  fastify.post('/user', {
    preHandler: [authorize(['admin', 'teacher', 'student'])],
    handler: addLoveToUserController,
  });

  // DELETE
  fastify.delete('/course/:courseId', {
    preHandler: [authorize(['admin', 'teacher', 'student'])],
    handler: removeLoveFromCourseController,
  });

  fastify.delete('/user/:userId', {
    preHandler: [authorize(['admin', 'teacher', 'student'])],

    handler: removeLoveFromUserController,
  });
};
export default loveRoute;
