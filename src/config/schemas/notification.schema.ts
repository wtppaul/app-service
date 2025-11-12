// src/schemas/notification.schema.ts
export const notificationSchemas = {
  paramsId: {
    type: 'object',
    properties: {
      id: { type: 'string' },
    },
    required: ['id'],
  },

  queryFilters: {
    type: 'object',
    properties: {
      type: { type: 'string' },
      unreadOnly: { type: 'boolean' },
      limit: { type: 'number', minimum: 1, maximum: 100 },
    },
  },
};
