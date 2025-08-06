"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.payoutsRelations = exports.submissionsRelations = exports.optionsRelations = exports.tasksRelations = exports.workersRelations = exports.usersRelations = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const schema_1 = require("./schema");
exports.usersRelations = (0, drizzle_orm_1.relations)(schema_1.users, ({ many }) => ({
    tasks: many(schema_1.tasks),
    payouts: many(schema_1.payouts),
}));
exports.workersRelations = (0, drizzle_orm_1.relations)(schema_1.workers, ({ many }) => ({
    submissions: many(schema_1.submissions),
}));
exports.tasksRelations = (0, drizzle_orm_1.relations)(schema_1.tasks, ({ one, many }) => ({
    user: one(schema_1.users, {
        fields: [schema_1.tasks.userId],
        references: [schema_1.users.id],
    }),
    options: many(schema_1.options),
    submissions: many(schema_1.submissions),
}));
exports.optionsRelations = (0, drizzle_orm_1.relations)(schema_1.options, ({ one, many }) => ({
    task: one(schema_1.tasks, {
        fields: [schema_1.options.taskId],
        references: [schema_1.tasks.id],
    }),
    submissions: many(schema_1.submissions),
}));
exports.submissionsRelations = (0, drizzle_orm_1.relations)(schema_1.submissions, ({ one }) => ({
    worker: one(schema_1.workers, {
        fields: [schema_1.submissions.workerId],
        references: [schema_1.workers.id],
    }),
    option: one(schema_1.options, {
        fields: [schema_1.submissions.optionId],
        references: [schema_1.options.id],
    }),
    task: one(schema_1.tasks, {
        fields: [schema_1.submissions.taskId],
        references: [schema_1.tasks.id],
    }),
}));
exports.payoutsRelations = (0, drizzle_orm_1.relations)(schema_1.payouts, ({ one }) => ({
    user: one(schema_1.users, {
        fields: [schema_1.payouts.userId],
        references: [schema_1.users.id],
    }),
}));
