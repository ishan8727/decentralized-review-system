import { drizzle } from "drizzle-orm/node-postgres"
import {Pool} from "pg";
import * as schema from "./schema";
import path from 'path';
import dotenv from 'dotenv';

// Load env from backend root folder
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is not defined in the environment variables.");
}

const pool = new Pool({ connectionString: process.env.DATABASE_URL })

const db = drizzle(pool);

export default db;