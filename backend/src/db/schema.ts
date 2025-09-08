import { pgTable, serial, text, integer, boolean, pgEnum, uniqueIndex } from 'drizzle-orm/pg-core';
export const txnStatusEnum = pgEnum('TxnStatus', ['Processing', 'Success', 'Failure']);

export const users = pgTable('User', {
  id: serial('id').primaryKey(),
  address: text('address').notNull().unique(),
});

export const workers = pgTable('Worker', {
  id: serial('id').primaryKey(),
  address: text('address').notNull().unique(),
  pendingAmount: integer('pending_amount').notNull(),
  lockedAmount: integer('locked_amount').notNull(),
});

export const tasks = pgTable('Task', {
  id: serial('id').primaryKey(),
  title: text('title').default('Select the most clickable thumbnail'),
  userId: integer('user_id').notNull(),
  signature: text('signature').notNull(),
  amount: integer('amount').notNull(),
  done: boolean('done').notNull().default(false),
});

export const options = pgTable('Option', {
  id: serial('id').primaryKey(),
  imageUrl: text('image_url').notNull(),
  taskId: integer('task_id').notNull(),
});

export const submissions = pgTable('Submission', {
  id: serial('id').primaryKey(),
  workerId: integer('worker_id').notNull(),
  optionId: integer('option_id').notNull(),
  taskId: integer('task_id').notNull(),
  amount: integer('amount').notNull(),
}, (table: { workerId: any; taskId: any; }) => ({
  uniqueWorkerTask: uniqueIndex('submission_unique_worker_task').on(table.workerId, table.taskId),
}));

export const payouts = pgTable('Payouts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  amount: integer('amount').notNull(),
  signature: text('signature').notNull(),
  status: txnStatusEnum('status').notNull(),
});

