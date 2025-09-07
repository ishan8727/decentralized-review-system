import { drizzle } from "drizzle-orm/node-postgres"
import {Pool} from "pg";
import * as schema from "./schema";
import path from 'path';
import dotenv from 'dotenv';


const { workers, tasks, submissions, options } = schema;
import { and, eq, isNull } from 'drizzle-orm';

// Load env from backend root folder
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is not defined in the environment variables.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

export const db = drizzle(pool);

export const getNextTask = async(worker_Id: number)=>{
	
	const workerId =  worker_Id;
	if (!workerId) {
		console.log("'Unauthorized no workerId")
		return;
	}
	// First, find a task that meets the criteria
			// Use LEFT JOIN + isNull to find tasks with no submission by this worker
			const taskTbd = await db
				.select({
					id: tasks.id,
					title: tasks.title,
					amount: tasks.amount
				})
				.from(tasks)
				.leftJoin(
					submissions,
					and(eq(submissions.taskId, tasks.id), eq(submissions.workerId, workerId))
				)
				.where(and(isNull(submissions.id), eq(tasks.done, false)))
				.limit(1);
	
			if (taskTbd.length === 0) {
				console.log(" No tasks available");
				return;
			}
	
			const task = taskTbd[0]; // Get the first (and only) task
	
			// Then, get the options for this specific task
			const taskOptions = await db.select()
				.from(options)
				.where(eq(options.taskId, task.id)); // Use task.id, not tasks.id
	
			return ({
				task: {
					id: task.id,
					title: task.title,
					amount: task.amount,
					options: taskOptions
				}
			});
}