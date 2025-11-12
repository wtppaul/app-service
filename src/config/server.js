const fastify = require('fastify')({ logger: true });
const config = require('./config');
const cookie = require('@fastify/cookie');
const jwt = require('@fastify/jwt');
const cors = require('@fastify/cors');
const rateLimit = require('@fastify/rate-limit');

fastify.register(cookie);
fastify.register(rateLimit);
fastify.register(jwt, { secret: config.JWT_SECRET_ACCESS });
fastify.register(cors, {
  origin: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    'http://localhost:3003',
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  credentials: true,
});

module.exports = fastify;
