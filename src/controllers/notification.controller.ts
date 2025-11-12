// src/controllers/notification.controller.ts
import { FastifyReply, FastifyRequest } from 'fastify';
import { notificationService } from '../services/notification.service';

export async function getNotificationsController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const notifications = await notificationService.getUserNotifications(
      req.user.id
    );
    reply.send(notifications);
  } catch (error) {
    reply.code(500).send({ message: 'Failed to fetch notifications', error });
  }
}

export async function markAsReadController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id } = req.params as { id: string };
    const notification = await notificationService.markAsRead(id);
    reply.send(notification);
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Failed to mark notification as read', error });
  }
}

export async function markAllAsReadController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const result = await notificationService.markAllAsRead(req.user.id);
    reply.send({ count: result.count });
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Failed to mark all notifications as read', error });
  }
}

export async function getUnreadCountController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const count = await notificationService.getUnreadCount(req.user.id);
    reply.send({ count });
  } catch (error) {
    reply.code(500).send({ message: 'Failed to fetch unread count', error });
  }
}

export async function deleteNotificationController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { id } = req.params as { id: string };
    await notificationService.deleteNotification(id);
    reply.send({ message: 'Notification deleted successfully' });
  } catch (error) {
    reply.code(500).send({ message: 'Failed to delete notification', error });
  }
}

// src/controllers/notification.controller.ts (tambahan)
export async function getFilteredNotificationsController(
  req: FastifyRequest,
  reply: FastifyReply
) {
  try {
    const { type, unreadOnly, limit } = req.query as {
      type?: string;
      unreadOnly?: boolean;
      limit?: number;
    };

    const notifications = await notificationService.getUserNotifications(
      req.user.id,
      {
        type,
        unreadOnly: unreadOnly === 'true',
        limit: limit ? parseInt(limit) : undefined,
      }
    );

    reply.send(notifications);
  } catch (error) {
    reply
      .code(500)
      .send({ message: 'Failed to fetch filtered notifications', error });
  }
}
