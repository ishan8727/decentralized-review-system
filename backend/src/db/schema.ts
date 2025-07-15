import {
  pgTable,
  serial,
  text,
  integer,
  boolean,
  pgEnum,
  uniqueIndex,
  index,
  primaryKey,
} from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// 🧾 ENUM
export const txnStatusEnum = pgEnum('TxnStatus', ['Processing', 'Success', 'Failure']);

// 👤 User
export const users = pgTable('User', {
  id: serial('id').primaryKey(),
  address: text('address').notNull().unique(),
});

// ⚒️ Worker
export const workers = pgTable('Worker', {
  id: serial('id').primaryKey(),
  address: text('address').notNull().unique(),
  pendingAmount: integer('pending_amount').notNull(),
  lockedAmount: integer('locked_amount').notNull(),
});

// 🧪 Task
export const tasks = pgTable('Task', {
  id: serial('id').primaryKey(),
  title: text('title').default('Select the most clickable thumbnail'),
  userId: integer('user_id').notNull(),
  signature: text('signature').notNull(),
  amount: integer('amount').notNull(),
  done: boolean('done').notNull().default(false),
});

// 🖼️ Option
export const options = pgTable('Option', {
  id: serial('id').primaryKey(),
  imageUrl: text('image_url').notNull(),
  taskId: integer('task_id').notNull(),
});

// 📤 Submission
export const submissions = pgTable('Submission', {
  id: serial('id').primaryKey(),
  workerId: integer('worker_id').notNull(),
  optionId: integer('option_id').notNull(),
  taskId: integer('task_id').notNull(),
  amount: integer('amount').notNull(),
}, (table) => ({
  uniqueWorkerTask: uniqueIndex('submission_unique_worker_task').on(table.workerId, table.taskId),
}));

// 💸 Payouts
export const payouts = pgTable('Payouts', {
  id: serial('id').primaryKey(),
  userId: integer('user_id').notNull(),
  amount: integer('amount').notNull(),
  signature: text('signature').notNull(),
  status: txnStatusEnum('status').notNull(),
});

