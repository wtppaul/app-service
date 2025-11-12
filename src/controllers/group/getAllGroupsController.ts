import { FastifyReply, FastifyRequest } from 'fastify';
import {
  getAllCategoriesService,
  getAllTagsService,
} from '../../services/group/getAllGroupsService';

export const getAllCategoriesController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const categories = await getAllCategoriesService();

    return reply.send(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};

export const getAllTagsController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const categories = await getAllTagsService();

    return reply.send(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    return reply.status(500).send({ error: 'Internal Server Error' });
  }
};
