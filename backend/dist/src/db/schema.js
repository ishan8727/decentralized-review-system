"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payouts = exports.submissions = exports.options = exports.tasks = exports.workers = exports.users = exports.txnStatusEnum = void 0;
const pg_core_1 = require("drizzle-orm/pg-core");
exports.txnStatusEnum = (0, pg_core_1.pgEnum)('TxnStatus', ['Processing', 'Success', 'Failure']);
exports.users = (0, pg_core_1.pgTable)('User', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    address: (0, pg_core_1.text)('address').notNull().unique(),
});
exports.workers = (0, pg_core_1.pgTable)('Worker', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    address: (0, pg_core_1.text)('address').notNull().unique(),
    pendingAmount: (0, pg_core_1.integer)('pending_amount').notNull(),
    lockedAmount: (0, pg_core_1.integer)('locked_amount').notNull(),
});
exports.tasks = (0, pg_core_1.pgTable)('Task', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    title: (0, pg_core_1.text)('title').default('Select the most clickable thumbnail'),
    userId: (0, pg_core_1.integer)('user_id').notNull(),
    signature: (0, pg_core_1.text)('signature').notNull(),
    amount: (0, pg_core_1.integer)('amount').notNull(),
    done: (0, pg_core_1.boolean)('done').notNull().default(false),
});
exports.options = (0, pg_core_1.pgTable)('Option', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    imageUrl: (0, pg_core_1.text)('image_url').notNull(),
    taskId: (0, pg_core_1.integer)('task_id').notNull(),
});
exports.submissions = (0, pg_core_1.pgTable)('Submission', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    workerId: (0, pg_core_1.integer)('worker_id').notNull(),
    optionId: (0, pg_core_1.integer)('option_id').notNull(),
    taskId: (0, pg_core_1.integer)('task_id').notNull(),
    amount: (0, pg_core_1.integer)('amount').notNull(),
}, (table) => ({
    uniqueWorkerTask: (0, pg_core_1.uniqueIndex)('submission_unique_worker_task').on(table.workerId, table.taskId),
}));
exports.payouts = (0, pg_core_1.pgTable)('Payouts', {
    id: (0, pg_core_1.serial)('id').primaryKey(),
    userId: (0, pg_core_1.integer)('user_id').notNull(),
    amount: (0, pg_core_1.integer)('amount').notNull(),
    signature: (0, pg_core_1.text)('signature').notNull(),
    status: (0, exports.txnStatusEnum)('status').notNull(),
});
