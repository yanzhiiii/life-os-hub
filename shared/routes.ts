import { z } from 'zod';
import {
  insertUserSchema,
  insertRoutineSchema,
  insertRoutineCompletionSchema,
  insertGoalSchema,
  insertTaskSchema,
  insertEventSchema,
  insertTransactionSchema,
  insertDebtSchema,
  insertSavingsGoalSchema,
  insertJournalEntrySchema,
  users,
  routines,
  routineCompletions,
  goals,
  tasks,
  events,
  transactions,
  debts,
  savingsGoals,
  journalEntries
} from './schema';

// ============================================
// SHARED ERROR SCHEMAS
// ============================================
export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
};

// ============================================
// API CONTRACT
// ============================================
export const api = {
  auth: {
    register: {
      method: 'POST' as const,
      path: '/api/register',
      input: insertUserSchema,
      responses: {
        201: z.custom<typeof users.$inferSelect>(),
        400: errorSchemas.validation,
      },
    },
    login: {
      method: 'POST' as const,
      path: '/api/login',
      input: z.object({
        username: z.string(),
        password: z.string(),
      }),
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
    logout: {
      method: 'POST' as const,
      path: '/api/logout',
      responses: {
        200: z.void(),
      },
    },
    me: {
      method: 'GET' as const,
      path: '/api/user',
      responses: {
        200: z.custom<typeof users.$inferSelect>(),
        401: errorSchemas.unauthorized,
      },
    },
  },
  routines: {
    list: {
      method: 'GET' as const,
      path: '/api/routines',
      responses: { 200: z.array(z.custom<typeof routines.$inferSelect>()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/routines',
      input: insertRoutineSchema,
      responses: { 201: z.custom<typeof routines.$inferSelect>() },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/routines/:id',
      input: insertRoutineSchema.partial(),
      responses: { 200: z.custom<typeof routines.$inferSelect>() },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/routines/:id',
      responses: { 204: z.void() },
    },
    logCompletion: {
      method: 'POST' as const,
      path: '/api/routines/:id/completions',
      input: insertRoutineCompletionSchema.omit({ routineId: true }),
      responses: { 201: z.custom<typeof routineCompletions.$inferSelect>() },
    },
    getCompletions: {
      method: 'GET' as const,
      path: '/api/routines/completions', // Query param ?date=YYYY-MM-DD
      input: z.object({ date: z.string().optional() }).optional(),
      responses: { 200: z.array(z.custom<typeof routineCompletions.$inferSelect>()) },
    }
  },
  tasks: {
    list: {
      method: 'GET' as const,
      path: '/api/tasks',
      responses: { 200: z.array(z.custom<typeof tasks.$inferSelect>()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/tasks',
      input: insertTaskSchema,
      responses: { 201: z.custom<typeof tasks.$inferSelect>() },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/tasks/:id',
      input: insertTaskSchema.partial(),
      responses: { 200: z.custom<typeof tasks.$inferSelect>() },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/tasks/:id',
      responses: { 204: z.void() },
    }
  },
  goals: {
    list: {
      method: 'GET' as const,
      path: '/api/goals',
      responses: { 200: z.array(z.custom<typeof goals.$inferSelect>()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/goals',
      input: insertGoalSchema,
      responses: { 201: z.custom<typeof goals.$inferSelect>() },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/goals/:id',
      input: insertGoalSchema.partial(),
      responses: { 200: z.custom<typeof goals.$inferSelect>() },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/goals/:id',
      responses: { 204: z.void() },
    }
  },
  events: {
    list: {
      method: 'GET' as const,
      path: '/api/events',
      responses: { 200: z.array(z.custom<typeof events.$inferSelect>()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/events',
      input: insertEventSchema,
      responses: { 201: z.custom<typeof events.$inferSelect>() },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/events/:id',
      input: insertEventSchema.partial(),
      responses: { 200: z.custom<typeof events.$inferSelect>() },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/events/:id',
      responses: { 204: z.void() },
    }
  },
  transactions: {
    list: {
      method: 'GET' as const,
      path: '/api/transactions',
      responses: { 200: z.array(z.custom<typeof transactions.$inferSelect>()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/transactions',
      input: insertTransactionSchema,
      responses: { 201: z.custom<typeof transactions.$inferSelect>() },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/transactions/:id',
      responses: { 204: z.void() },
    }
  },
  debts: {
    list: {
      method: 'GET' as const,
      path: '/api/debts',
      responses: { 200: z.array(z.custom<typeof debts.$inferSelect>()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/debts',
      input: insertDebtSchema,
      responses: { 201: z.custom<typeof debts.$inferSelect>() },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/debts/:id',
      input: insertDebtSchema.partial(),
      responses: { 200: z.custom<typeof debts.$inferSelect>() },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/debts/:id',
      responses: { 204: z.void() },
    }
  },
  savings: {
    list: {
      method: 'GET' as const,
      path: '/api/savings',
      responses: { 200: z.array(z.custom<typeof savingsGoals.$inferSelect>()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/savings',
      input: insertSavingsGoalSchema,
      responses: { 201: z.custom<typeof savingsGoals.$inferSelect>() },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/savings/:id',
      input: insertSavingsGoalSchema.partial(),
      responses: { 200: z.custom<typeof savingsGoals.$inferSelect>() },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/savings/:id',
      responses: { 204: z.void() },
    }
  },
  journal: {
    list: {
      method: 'GET' as const,
      path: '/api/journal',
      responses: { 200: z.array(z.custom<typeof journalEntries.$inferSelect>()) },
    },
    create: {
      method: 'POST' as const,
      path: '/api/journal',
      input: insertJournalEntrySchema,
      responses: { 201: z.custom<typeof journalEntries.$inferSelect>() },
    },
    update: {
      method: 'PATCH' as const,
      path: '/api/journal/:id',
      input: insertJournalEntrySchema.partial(),
      responses: { 200: z.custom<typeof journalEntries.$inferSelect>() },
    },
    delete: {
      method: 'DELETE' as const,
      path: '/api/journal/:id',
      responses: { 204: z.void() },
    }
  }
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
