// File: src/controllers/tag.controller.ts
import { FastifyRequest, FastifyReply } from 'fastify';
import { updateCourseTagsBySlug } from '../services/tag.service';

export const updateCourseTagsController = async (
  req: FastifyRequest,
  reply: FastifyReply
) => {
  try {
    const { id } = req.body as { id: string };
    const { tagIds } = req.body as { tagIds: string[] };

    if (!tagIds || !Array.isArray(tagIds)) {
      return reply.status(400).send({ message: 'tagIds must be an array' });
    }

    const updatedCourse = await updateCourseTagsBySlug(id, tagIds);
    return reply.status(200).send(updatedCourse);
  } catch (err) {
    console.error('Error updating course tags:', err);
    return reply.status(500).send({ message: 'Failed to update tags' });
  }
};
