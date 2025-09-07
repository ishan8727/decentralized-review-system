import { RequestHandler, Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { and, eq, isNull } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { workerAuthMiddleware } from '../Middlewares/auth';
import * as schema from '../db/schema';
import { getNextTask } from '../db/databse';

const { workers, tasks, submissions, options } = schema;

// Initialize Drizzle with schema
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

const JWT_WORKER = (process.env.JWT_SECRET || '') + 'RandomString123';
const router = Router();

router.post('/submissions', workerAuthMiddleware as RequestHandler, async(req, res)=>{
    // TODO: Implement submission logic
    res.status(501).json({ message: 'Not implemented' });
});

router.get('/nextTask', workerAuthMiddleware as RequestHandler, async (req, res) => {
    const workerId = req.workerId;
    if (!workerId) {
        res.status(401).json({ message: 'workerId not found!' });
        return;
    }

    try {
        const nextTask = await getNextTask(workerId);
        res.json(nextTask);

        if(!nextTask){
            res.status(401).json({message:"No tasks available!"});
            return;
        }

    } catch (error) {
        res.status(401).json({message:'Error fetching next task!'});
        console.log(error);
        return;

    }
});

router.post('/signin', async (req, res) => {
    const hardcodedAddress = '0x779c7FF70C424B0A494bF524Fd4a021833D8B5bd';

    try {
        const worker = await db.query.workers.findFirst({
            where: eq(workers.address, hardcodedAddress)
        });

        let existingWorker = worker;

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
    } catch (error) {
        console.error('Error during worker sign-in:', error);
        res.status(500).json({ error: 'Internal server error during sign-in' });
    }
});

export default router;