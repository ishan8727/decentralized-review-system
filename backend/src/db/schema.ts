import { integer } from "drizzle-orm/pg-core";
import { serial, varchar, pgTable } from "drizzle-orm/pg-core";

export const user = pgTable("users", {
  id: serial("id").primaryKey(),
  address: varchar("address").notNull().unique(),
});

export const worker = pgTable("worker",{
    id: serial("id").primaryKey(),
    address: varchar("address").notNull().unique(),
});

export const task = pgTable("task",{
    id: serial("id").primaryKey(),
    title: varchar("title").notNull(),

    userId: integer("user_id").references(() => user.id),
});

export const Options = pgTable("options",{
    id: serial("id").primaryKey(),
    imagrUrl: varchar("imageUrl").notNull(),
    optionId: integer(),

    taskId: integer("task_id").references(()=> task.id).notNull(), 
});

export const submission = pgTable("submission",{
    id: serial("id").primaryKey(),
    
    workerId: integer().references(()=> worker.id),
    optionId: integer("option_id").references(()=> Options.id)
});