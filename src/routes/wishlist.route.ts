// src/routes/wishlist.route.ts
import { FastifyPluginAsync } from 'fastify';
import { authorize } from '../utils/authorize';
import {
  addWishlistController,
  removeWishlistController,
  getWishlistController,
  checkWishlistController,
  getWishlistCountController,
} from '../controllers/wishlist.controller';

const wishlistRoute: FastifyPluginAsync = async (fastify) => {
  fastify.get(`/count/:courseId`, getWishlistCountController);
  fastify.get('/check', {
    preHandler: [authorize(['admin', 'teacher', 'student'])],
    handler: checkWishlistController,
  });

  // GET /wishlist → ambil daftar wishlist user
  fastify.get('/', {
    preHandler: [authorize(['admin', 'teacher', 'student'])],
    handler: getWishlistController,
  });

  // POST /wishlist → tambah ke wishlist
  fastify.post('/', {
    preHandler: [authorize(['admin', 'teacher', 'student'])],
    handler: addWishlistController,
  });

  // DELETE /wishlist/:courseId → hapus dari wishlist
  fastify.delete('/:courseId', {
    preHandler: [authorize(['admin', 'teacher', 'student'])],
    handler: removeWishlistController,
  });
};

export default wishlistRoute;
