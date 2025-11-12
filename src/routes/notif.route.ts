// src/routes/notification.route.ts
import { FastifyPluginAsync } from 'fastify';
import { authorize } from '../utils/authorize';
import {
  getNotificationsController,
  markAsReadController,
  markAllAsReadController,
  getUnreadCountController,
  deleteNotificationController,
  getFilteredNotificationsController,
} from '../controllers/notification.controller';
import { notificationSchemas } from '../config/schemas/notification.schema';

const notifRoute: FastifyPluginAsync = async (fastify) => {
  fastify.addHook('preHandler', authorize(['student', 'teacher', 'admin']));

  // Dapatkan notifikasi user
  fastify.get('/', {
    schema: {
      querystring: notificationSchemas.queryFilters,
    },
    handler: getFilteredNotificationsController,
  });

  // // Dapatkan notifikasi user
  // fastify.get('/', getNotificationsController);

  // Dapatkan jumlah notifikasi belum dibaca
  fastify.get('/unread-count', getUnreadCountController);

  // Tandai notifikasi sebagai terbaca
  fastify.patch('/:id/read', markAsReadController);

  // Tandai semua notifikasi sebagai terbaca
  fastify.patch('/read-all', markAllAsReadController);

  // Hapus notifikasi
  fastify.delete('/:id', deleteNotificationController);

  fastify.get('/filter', getFilteredNotificationsController);
};

export default notifRoute;
