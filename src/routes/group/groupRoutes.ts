import { FastifyInstance } from 'fastify';
import {
  getAllCategoriesController,
  getAllTagsController,
} from '../../controllers/group/getAllGroupsController';

export async function groupRoutes(server: FastifyInstance) {
  server.get('/categories', getAllCategoriesController);
  server.get('/tags', getAllTagsController);
}
