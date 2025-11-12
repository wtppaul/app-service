import { FastifyRequest, FastifyReply } from 'fastify';
import { prisma } from '../utils/prisma';
import {
  generateIframeStreamURL,
  generateHlsStreamURL,
} from '../utils/generateSignedStreamURL';
import { checkEnrollmentService } from '../services/enrollment.service';
import { validateCourseOwnership } from '../utils/validateAccess';

export const getSignedLessonUrlController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  const { courseId, lessonId } = req.params as {
    courseId: string;
    lessonId: string;
  };
  const token = req.cookies.accessToken;

  // Cari lesson termasuk relasi chapter untuk verifikasi courseId
  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { chapter: true },
  });

  if (!lesson || !lesson.chapter) {
    return reply.status(404).send({ message: 'Lesson not found' });
  }

  // Verifikasi lesson termasuk dalam course yang diminta
  if (lesson.chapter.courseId !== courseId) {
    return reply
      .status(400)
      .send({ message: 'Lesson does not belong to this course' });
  }

  // Check user access rights
  const user = (req as any).user;
  if (user) {
    const isOwner = await validateCourseOwnership(user.id, courseId, user.role);
    const isEnrolled = await checkEnrollmentService(user.id, courseId);

    const isPermitted = isOwner || isEnrolled;
    if (!isPermitted) return reply.status(403).send({ message: 'Forbidden' });
  }

  const url = generateIframeStreamURL(lesson.playbackId);
  // const url = '/Testurl/pb-id-one';
  console.log('URL ::: ', url);
  return reply.send({ url });
};
