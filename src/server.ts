// src/server.ts
import { buildApp } from './app';

const start = async () => {
  const server = await buildApp();

  try {
    await server.listen({ port: 5002, host: '0.0.0.0' });
    console.log('🚀 Dash Service running on http://localhost:5002');
  } catch (err) {
    server.log.error(err);
    process.exit(1);
  }
};

start();
