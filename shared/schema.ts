import { pgTable, text, serial, integer, boolean, timestamp, jsonb, decimal } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
import { relations } from "drizzle-orm";

// === USERS ===
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  displayName: text("display_name"),
  currency: text("currency").default("PHP"),
  paydayConfig: jsonb("payday_config").$type<{
    type: "fixed" | "custom",
    dates?: number[], // e.g., [15, 30]
    nextDate?: string // ISO date string
  }>(),
});

// === ROUTINES ===
export const routines = pgTable("routines", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  steps: jsonb("steps").$type<string[]>().notNull(), // Array of step descriptions
  frequency: text("frequency").default("daily"),
  isArchived: boolean("is_archived").default(false),
});

export const routineCompletions = pgTable("routine_completions", {
  id: serial("id").primaryKey(),
  routineId: integer("routine_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  completedSteps: jsonb("completed_steps").$type<boolean[]>().notNull(), // Matching index to steps
});

// === GOALS ===
export const goals = pgTable("goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  targetDate: timestamp("target_date"),
  completed: boolean("completed").default(false),
  milestones: jsonb("milestones").$type<{id: string, text: string, completed: boolean}[]>(),
});

// === TASKS ===
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  dueDate: timestamp("due_date"),
  priority: text("priority").default("medium"), // low, medium, high
  status: text("status").default("todo"), // todo, in_progress, done
  tags: text("tags").array(),
  goalId: integer("goal_id"), // Optional link to goal
});

// === EVENTS (Calendar) ===
export const events = pgTable("events", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  title: text("title").notNull(),
  startTime: timestamp("start_time").notNull(),
  endTime: timestamp("end_time"),
  category: text("category").default("general"),
  notes: text("notes"),
});

// === FINANCE ===
export const transactions = pgTable("transactions", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  type: text("type").notNull(), // income, expense
  amount: decimal("amount", { precision: 12, scale: 2 }).notNull(),
  date: timestamp("date").notNull(),
  category: text("category").notNull(),
  note: text("note"),
  isRecurring: boolean("is_recurring").default(false),
});

export const debts = pgTable("debts", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  totalAmount: decimal("total_amount", { precision: 12, scale: 2 }).notNull(),
  remainingAmount: decimal("remaining_amount", { precision: 12, scale: 2 }).notNull(),
  dueDate: timestamp("due_date"),
  interestRate: decimal("interest_rate", { precision: 5, scale: 2 }),
});

export const savingsGoals = pgTable("savings_goals", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  name: text("name").notNull(),
  targetAmount: decimal("target_amount", { precision: 12, scale: 2 }).notNull(),
  currentAmount: decimal("current_amount", { precision: 12, scale: 2 }).default("0"),
});

// === JOURNAL ===
export const journalEntries = pgTable("journal_entries", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  content: text("content").notNull(),
  mood: text("mood"), // happy, neutral, sad, etc.
});

// === DAY STATUSES (Workday/Leave Tracking) ===
export const dayStatuses = pgTable("day_statuses", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  status: text("status").notNull().default("working"), // working, rest, sick_leave, annual_leave, custom
  customLabel: text("custom_label"), // For custom leave types
  color: text("color"), // Optional color for custom status
});

// === RELATIONS ===
export const routinesRelations = relations(routines, ({ many }) => ({
  completions: many(routineCompletions),
}));

export const routineCompletionsRelations = relations(routineCompletions, ({ one }) => ({
  routine: one(routines, {
    fields: [routineCompletions.routineId],
    references: [routines.id],
  }),
}));

export const tasksRelations = relations(tasks, ({ one }) => ({
  goal: one(goals, {
    fields: [tasks.goalId],
    references: [goals.id],
  }),
}));

export const goalsRelations = relations(goals, ({ many }) => ({
  tasks: many(tasks),
}));


// === SCHEMAS ===
export const insertUserSchema = createInsertSchema(users).omit({ id: true });
export const updateUserSettingsSchema = z.object({
  displayName: z.string().optional(),
  currency: z.string().optional(),
  paydayConfig: z.object({
    type: z.enum(["fixed", "custom", "monthly", "semiMonthly"]),
    dates: z.array(z.number()).optional(),
    nextDate: z.string().optional(),
  }).optional(),
});
export const insertRoutineSchema = createInsertSchema(routines).omit({ id: true, userId: true });
export const insertRoutineCompletionSchema = createInsertSchema(routineCompletions).omit({ id: true });
export const insertGoalSchema = createInsertSchema(goals).omit({ id: true, userId: true });
export const insertTaskSchema = createInsertSchema(tasks).omit({ id: true, userId: true });
export const insertEventSchema = createInsertSchema(events).omit({ id: true, userId: true });
export const insertTransactionSchema = createInsertSchema(transactions).omit({ id: true, userId: true });
export const insertDebtSchema = createInsertSchema(debts).omit({ id: true, userId: true });
export const insertSavingsGoalSchema = createInsertSchema(savingsGoals).omit({ id: true, userId: true });
export const insertJournalEntrySchema = createInsertSchema(journalEntries).omit({ id: true, userId: true });
export const insertDayStatusSchema = createInsertSchema(dayStatuses).omit({ id: true, userId: true });

// === TYPES ===
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Routine = typeof routines.$inferSelect;
export type InsertRoutine = z.infer<typeof insertRoutineSchema>;
export type RoutineCompletion = typeof routineCompletions.$inferSelect;
export type InsertRoutineCompletion = z.infer<typeof insertRoutineCompletionSchema>;
export type Goal = typeof goals.$inferSelect;
export type InsertGoal = z.infer<typeof insertGoalSchema>;
export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;
export type Event = typeof events.$inferSelect;
export type InsertEvent = z.infer<typeof insertEventSchema>;
export type Transaction = typeof transactions.$inferSelect;
export type InsertTransaction = z.infer<typeof insertTransactionSchema>;
export type Debt = typeof debts.$inferSelect;
export type InsertDebt = z.infer<typeof insertDebtSchema>;
export type SavingsGoal = typeof savingsGoals.$inferSelect;
export type InsertSavingsGoal = z.infer<typeof insertSavingsGoalSchema>;
export type JournalEntry = typeof journalEntries.$inferSelect;
export type InsertJournalEntry = z.infer<typeof insertJournalEntrySchema>;
export type DayStatus = typeof dayStatuses.$inferSelect;
export type InsertDayStatus = z.infer<typeof insertDayStatusSchema>;
export type UpdateUserSettings = z.infer<typeof updateUserSettingsSchema>;
