import { FastifyReply, FastifyRequest } from 'fastify';
import { wishlistService } from '../services/wishlist.service';

export async function addWishlistController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const { courseId } = req.body as { courseId: string };
  const authId = req.user.id;
  const role = req.user.role.toUpperCase(); // Konversi ke uppercase

  try {
    const existing = await wishlistService.isInWishlist(authId, courseId);
    if (existing) {
      return reply.code(400).send({ message: 'Course already in wishlist' });
    }

    const wishlist = await wishlistService.addToWishlist(
      authId,
      role,
      courseId
    );
    reply.send(wishlist);
  } catch (err) {
    reply.code(500).send({ message: 'Failed to add wishlist', error: err });
  }
}

export async function removeWishlistController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const { courseId } = req.params as { courseId: string };
  const authId = req.user.id;

  try {
    await wishlistService.removeFromWishlist(authId, courseId);
    reply.send({ message: 'Removed from wishlist' });
  } catch (err) {
    reply.code(500).send({ message: 'Failed to remove wishlist', error: err });
  }
}

export async function getWishlistController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const authId = req.user.id;

  try {
    const wishlist = await wishlistService.getUserWishlist(authId);
    reply.send(wishlist);
  } catch (err) {
    reply.code(500).send({ message: 'Failed to fetch wishlist', error: err });
  }
}

export async function checkWishlistController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const { courseId } = req.query as { courseId: string };
  const authId = req.user.id;

  try {
    const existing = await wishlistService.isInWishlist(authId, courseId);
    reply.send({ isBookmarked: !!existing });
  } catch (err) {
    reply.code(500).send({ message: 'Failed to check wishlist', error: err });
  }
}

// Wishlist controller
export async function getWishlistCountController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const { courseId } = req.params as { courseId: string };

  try {
    const wishlists = await wishlistService.getWishlistCountByCourse(courseId);
    reply.send({ count: wishlists });
  } catch (err) {
    reply
      .code(500)
      .send({ message: 'Failed to fetch wishlist count', error: err });
  }
}
