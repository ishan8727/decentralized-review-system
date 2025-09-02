import { RequestHandler, Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { and, eq, isNull } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { workerAuthMiddleware } from '../Middlewares/auth';
import { workers, tasks, submissions } from '../db/schema';

// Initialize Drizzle with schema
const client = postgres(process.env.DATABASE_URL!);
import * as schema from "../db/schema";
const db = drizzle(client, { schema });


const JWT_WORKER = (process.env.JWT_SECRET || '') + 'RandomString123';
const router = Router();

router.get('/nextTask', workerAuthMiddleware as RequestHandler, async (req, res) => {
    const workerId = req.workerId;
    if (!workerId) {
        res.status(401).json({ message: 'Unauthorized (no workerId)' });
        return;
    }

    try {
        const rows = await db
            .select({
                id: tasks.id,
                title: tasks.title,
                userId: tasks.userId,
                amount: tasks.amount,
                done: tasks.done,
                signature: tasks.signature
            })
            .from(tasks)
            .leftJoin(
                submissions,
                and(
                    eq(submissions.taskId, tasks.id),
                    eq(submissions.workerId, workerId)
                )
            )
            .where(
                and(
                    isNull(submissions.id),
                    eq(tasks.done, false)
                )
            )
            .limit(1);

        if (!rows.length) {
            res.status(404).json({ message: 'No tasks available' });
            return;
        }

        res.json(rows[0]);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Internal server error' });
    }
});

router.post('/signin', async (req, res) => {
    const hardcodedAddress = '0x779c7FF70C424B0A494bF524Fd4a021833D8B5bd';

    try {
        // find the user
        const worker = await db.query.workers.findFirst({
            where: eq(workers.address, hardcodedAddress)
        });

        let existingWorker = worker;

        // create one if not found
        if (!existingWorker) {
            const [newWorker] = await db.insert(workers)
                .values({
                    address: hardcodedAddress,
                    pendingAmount: 0,
                    lockedAmount: 0
                })
                .returning();

            existingWorker = newWorker;

            console.log(`Created new user ${newWorker}! and -> ${existingWorker}`);
        }

        const token = jwt.sign({ workerId: existingWorker.id }, JWT_WORKER, { expiresIn: '7d' });
        console.log(`Token generated! ${token}`);
        res.json({ token });
        return;

    }
    catch (error) {
        console.error('Error during worker sign-in:', error);
        res.status(500).json({ error: 'Internal server error during sign-in' });
        return;
    }
});


export default router;