import { FastifyRequest, FastifyReply } from 'fastify';
import {
  getStatsPerCategoryService,
  getStatsPerTagService,
  getStatsCategoryTeachersService,
  getStatsTagTeachersService,
} from '../services/stats.service';

export const getStatsPerCategoryController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const result = await getStatsPerCategoryService();
    return reply.send(result);
  } catch (err) {
    console.error('Error in getCourseStatsPerCategory:', err);
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const getStatsPerTagController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const result = await getStatsPerTagService();
    return reply.send(result);
  } catch (err) {
    console.error('Error in getCourseStatsPerTag:', err);
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const getStatsCategoryTeachersController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const result = await getStatsCategoryTeachersService();
    return reply.send(result);
  } catch (err) {
    console.error('Error in getCourseStatsPerCategory:', err);
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};

export const getStatsTagTeachersController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const result = await getStatsTagTeachersService();
    return reply.send(result);
  } catch (err) {
    console.error('Error in getCourseStatsPerTag:', err);
    return reply.status(500).send({ message: 'Internal Server Error' });
  }
};
