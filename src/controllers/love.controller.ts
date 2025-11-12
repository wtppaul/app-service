import { FastifyRequest, FastifyReply } from 'fastify';
import { loveService } from '../services/love.service';
import { wishlistService } from '../services/wishlist.service';
// Love Course Controllers

export async function addLoveToCourseController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const { courseId } = req.body as { courseId: string };
  const authId = req.user.id;
  const role = req.user.role.toUpperCase();

  try {
    const existing = await loveService.isCourseLovedByUser(authId, courseId);
    if (existing) {
      return reply.code(400).send({ message: 'Course already loved' });
    }

    const love = await loveService.addLoveToCourse(authId, role, courseId);
    reply.send(love);
  } catch (err) {
    reply
      .code(500)
      .send({ message: 'Failed to add love to course', error: err });
  }
}

export async function removeLoveFromCourseController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const { courseId } = req.params as { courseId: string };
  const authId = req.user.id;

  try {
    await loveService.removeLoveFromCourse(authId, courseId);
    reply.send({ message: 'Removed love from course' });
  } catch (err) {
    reply
      .code(500)
      .send({ message: 'Failed to remove love from course', error: err });
  }
}

// export async function getCourseLovesController(
//   req: FastifyRequest,
//   reply: FastifyReply
// ) {
//   const { courseId } = req.params as { courseId: string };

//   try {
//     const loves = await loveService.getCourseLovesCount(courseId);
//     reply.send(loves);
//   } catch (err) {
//     reply
//       .code(500)
//       .send({ message: 'Failed to fetch course loves', error: err });
//   }
// }

export async function checkCourseLoveController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const { courseId } = req.query as { courseId: string };
  const authId = req.user.id;

  try {
    const existing = await loveService.isCourseLovedByUser(authId, courseId);
    reply.send({ isLoved: !!existing });
  } catch (err) {
    reply
      .code(500)
      .send({ message: 'Failed to check course love', error: err });
  }
}

// Love count controller
export async function getCourseLoveCountController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const { courseId } = req.params as { courseId: string };

  try {
    const count = await loveService.getCourseLovesCount(courseId);
    reply.send({ count });
  } catch (err) {
    reply
      .code(500)
      .send({ message: 'Failed to fetch course love count', error: err });
  }
}

// Love User Controllers
export async function addLoveToUserController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const { lovedUserId } = req.body as { lovedUserId: string };
  const authId = req.user.id;
  const role = req.user.role.toUpperCase();

  try {
    const existing = await loveService.isUserLovedByUser(authId, lovedUserId);
    if (existing) {
      return reply.code(400).send({ message: 'User already loved' });
    }

    const love = await loveService.addLoveToUser(authId, role, lovedUserId);
    reply.send(love);
  } catch (err) {
    reply.code(500).send({ message: 'Failed to add love to user', error: err });
  }
}

export async function removeLoveFromUserController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const { lovedUserId } = req.params as { lovedUserId: string };
  const authId = req.user.id;

  try {
    await loveService.removeLoveFromUser(authId, lovedUserId);
    reply.send({ message: 'Removed love from user' });
  } catch (err) {
    reply
      .code(500)
      .send({ message: 'Failed to remove love from user', error: err });
  }
}

export async function getUserLovesController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const { lovedUserId } = req.params as { lovedUserId: string };

  try {
    const loves = await loveService.getUserLoves(lovedUserId);
    reply.send(loves);
  } catch (err) {
    reply.code(500).send({ message: 'Failed to fetch user loves', error: err });
  }
}

export async function checkUserLoveController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  const { lovedUserId } = req.query as { lovedUserId: string };
  const authId = req.user.id;

  try {
    const existing = await loveService.isUserLovedByUser(authId, lovedUserId);
    reply.send({ isLoved: !!existing });
  } catch (err) {
    reply.code(500).send({ message: 'Failed to check user love', error: err });
  }
}
