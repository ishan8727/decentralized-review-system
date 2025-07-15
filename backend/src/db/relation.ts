import { relations } from "drizzle-orm";
import { payouts, submissions, tasks, users, options, workers } from "./schema";

export const usersRelations = relations(users, ({ many }) => ({
  tasks: many(tasks),
  payouts: many(payouts),
}));

export const workersRelations = relations(workers, ({ many }) => ({
  submissions: many(submissions),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  user: one(users, {
    fields: [tasks.userId],
    references: [users.id],
  }),
  options: many(options),
  submissions: many(submissions),
}));

export const optionsRelations = relations(options, ({ one, many }) => ({
  task: one(tasks, {
    fields: [options.taskId],
    references: [tasks.id],
  }),
  submissions: many(submissions),
}));

export const submissionsRelations = relations(submissions, ({ one }) => ({
  worker: one(workers, {
    fields: [submissions.workerId],
    references: [workers.id],
  }),
  option: one(options, {
    fields: [submissions.optionId],
    references: [options.id],
  }),
  task: one(tasks, {
    fields: [submissions.taskId],
    references: [tasks.id],
  }),
}));

export const payoutsRelations = relations(payouts, ({ one }) => ({
  user: one(users, {
    fields: [payouts.userId],
    references: [users.id],
  }),
}));
