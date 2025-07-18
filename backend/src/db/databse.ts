import { drizzle } from "drizzle-orm/neon-http"
import {neon} from "@neondatabase/serverless";
import * as schema from "./schema";
import path from 'path';
import dotenv from 'dotenv';

// Load env from backend root folder
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

if (!process.env.DATABASE_URL) {
	throw new Error("DATABASE_URL is not defined in the environment variables.");
}
const sql = neon(process.env.DATABASE_URL);

const db = drizzle(sql, {schema});

export default db;