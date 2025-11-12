// src/app.ts
import Fastify from 'fastify';
import { prisma } from './utils/prisma';
import fastifyCookie from '@fastify/cookie';
import courseRoute from './routes/course.route';
import internalRoute from './routes/internal.route';
import chapterRoute from './routes/chapter.route';
import lessonRoute from './routes/lesson.route';
import enrollmentRoute from './routes/enrollment.route';
import streamRoute from './routes/stream.route';
import cors from '@fastify/cors';
import dashboardRoutes from './routes/dashboard.routes';
import { groupRoutes } from './routes/group/groupRoutes';
import cartRoute from './routes/cart.route';
import checkoutRoute from './routes/checkout.route';
import midtransRoute from './routes/midtrans.route';
import wishlistRoute from './routes/wishlist.route';
import loveRoute from './routes/love.route';
import notifRoute from './routes/notif.route';

export const buildApp = () => {
  const app = Fastify({
    logger: true,
    maxParamLength: 500, // ubah sesuai kebutuhan
  });

  // Register cors
  app.register(cors, {
    origin: [
      'https://auth.localhost.test',
      'https://app.localhost.test',
      'https://www.localhost.test',
      'https://heartbeat.localhost.test',
      'https://app-api.localhost.test',
      'https://public-api.localhost.test',
      'https://auth-api.localhost.test',
      'https://heartbeat-api.localhost.test',
    ],
    methods: ['GET', 'PATCH', 'POST', 'PUT', 'DELETE'],
    credentials: true,
  });

  // Register Prisma
  app.decorate('prisma', prisma);

  // Register routes
  app.register(courseRoute, { prefix: '/api/courses' });
  app.register(groupRoutes, { prefix: '/api/group' });
  app.register(chapterRoute, { prefix: '/api/chapters' });
  app.register(lessonRoute, { prefix: '/api/lessons' });
  app.register(enrollmentRoute, { prefix: '/api/enrollment' });
  app.register(internalRoute, { prefix: '/int' });
  app.register(streamRoute, { prefix: '/api/str' });
  app.register(dashboardRoutes, { prefix: '/api/dashboard' });
  app.register(cartRoute, { prefix: '/api/cart' });
  app.register(checkoutRoute, { prefix: '/api/checkout' });
  app.register(midtransRoute, { prefix: '/api/mt' });
  app.register(wishlistRoute, { prefix: '/api/bookmarks' });
  app.register(loveRoute, { prefix: '/api/loves' });
  app.register(notifRoute, { prefix: '/api/notifications' });

  // Register cookie
  app.register(fastifyCookie);

  return app;
};
