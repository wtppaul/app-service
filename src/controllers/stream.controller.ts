import { prisma } from '../utils/prisma';
import axios from 'axios';
import { FastifyRequest, FastifyReply } from 'fastify';
import crypto from 'crypto';
import { Lesson } from '../../generated/prisma';
import { validateCourseOwnership } from '../utils/validateAccess';

// route: POST /api/str/upload-url
export const getUploadUrlController = async (
  req: FastifyRequest<{
    Body: { lessonId: string; chapterId: string; courseId: string };
  }>,
  reply: FastifyReply
) => {
  const { lessonId } = req.body;

  const lesson = await prisma.lesson.findUnique({
    where: { id: lessonId },
    include: { chapter: true },
  });
  const chapter = await prisma.lesson.findUnique({
    where: { id: lesson?.chapterId },
  });

  if (!lesson) {
    return reply.status(404).send({ message: 'Lesson not found' });
  }

  const user = (req as any).user;

  console.log('Bodyhjk ::: ', ' ::: ', req.body);
  console.log('isOwner ::: ', ' ::: ', user);

  const isOwner = await validateCourseOwnership(
    user.id,
    lesson.chapter.courseId,
    user.role
  );

  if (!isOwner) {
    return reply.status(403).send({ message: 'Unauthorized' });
  }
  console.log('isOwner ::: ', isOwner, ' ::: ', user);
  const videoName = 'testVideoName';
  try {
    const response = await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/stream/direct_upload`,
      {
        maxDurationSeconds: 3600,
        requireSignedURLs: true,
        creator: `EstaTeacher: ${user.username}`,
        allowedOrigins: [
          `${process.env.FRONTEND_DASH_URL}`,
          `${process.env.FRONTEND_PUB_URL}`,
        ],
        meta: {
          lessonId,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.CF_STREAM_API_TOKEN}`,
        },
      }
    );
    console.log(response.data.result);
    return reply.send(response.data.result);
  } catch (error) {
    console.error('Upload URL error:', error);
    return reply.status(500).send({ error: 'Failed to generate upload URL' });
  }
};

const wait = (ms: number) => new Promise((res) => setTimeout(res, ms));

export const streamWebhookController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  const signatureHeader = req.headers['webhook-signature'] as string;
  const secret = process.env.CF_STREAM_WEBHOOK_SECRET;

  if (!signatureHeader || !secret) {
    return reply
      .status(403)
      .send({ error: 'Missing webhook-signature or secret' });
  }

  const [timePart, sigPart] = signatureHeader.split(',');
  const timestamp = timePart?.split('=')[1];
  const sig1 = sigPart?.split('=')[1];

  const payload = JSON.stringify(req.body);
  const expectedSig = crypto
    .createHmac('sha256', secret)
    .update(`${timestamp}.${payload}`)
    .digest('hex');

  if (sig1 !== expectedSig) {
    return reply.status(403).send({ error: 'Invalid signature' });
  }

  const { uid, meta, duration } = req.body as any;

  // 🔁 Retry find lesson up to 5 times
  let lesson = null;
  for (let i = 0; i < 5; i++) {
    lesson = await prisma.lesson.findUnique({
      where: { id: meta.lessonId },
      include: { chapter: true },
    });
    if (lesson) break;
    await wait(500); // wait 0.5s
  }

  if (!lesson) {
    return reply
      .status(404)
      .send({ error: 'Lesson not found after 5 retries' });
  }

  await prisma.lesson.update({
    where: { id: lesson.id },
    data: {
      playbackId: uid,
      duration: Math.round(duration),
    },
  });

  const chapter = await prisma.chapter.findUnique({
    where: { id: lesson?.chapterId },
    include: { course: true },
  });
  const course = await prisma.course.findUnique({
    where: { id: chapter?.courseId },
  });
  const truncatedTitle = chapter?.title
    ? chapter.title.length > 40
      ? chapter.title.slice(0, 37) + '...'
      : chapter.title
    : 'Untitled';

  try {
    await axios.post(
      `https://api.cloudflare.com/client/v4/accounts/${process.env.CF_ACCOUNT_ID}/stream/${uid}`,
      {
        meta: {
          name: `${course?.id} - ${course?.title}`,
        },
        publicDetails: {
          title: truncatedTitle,
          logo: `https://imagedelivery.net/tmJ-ajkrdLmfPSTk6muiSA/33288828-fd59-4924-86d3-6df222220300/public`,
        },
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.CF_STREAM_API_TOKEN}`,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (err) {
    console.error('❌ Gagal update publicDetails/meta ke Cloudflare:', err);
  }
  return reply.send({ success: true });
};
