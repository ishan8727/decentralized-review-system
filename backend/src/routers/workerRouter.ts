import { RequestHandler, Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { eq, sql } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { workerAuthMiddleware } from '../Middlewares/auth';
import * as schema from '../db/schema';
import { getNextTask } from '../db/databse';
import { createSubmissionInput } from '../validate';

// Destructure all tables from schema
const { workers, tasks, options, submissions, payouts } = schema;

// Initialize Drizzle with schema
const client = postgres(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

const JWT_WORKER = (process.env.JWT_SECRET || '') + 'RandomString123';
const router = Router();

const total_submissions = 100;

router.post('/payout', workerAuthMiddleware as RequestHandler, async(req, res)=>{

    const txnId = '123xxx0d546bsdw'

    // but we still need to add a lock here {I'm not usre where to be precise but I think on txn maybe wrong 3:28 video} -> actually we will lock the (WORKER we fetched) worker as we are playing with worker's amounts..... you get it when you code!!!!!
    // the lock helps in situations like parallel requests can be created giving like 2 or more txns to same workerId.
    // so to avoid it we nned to create LOCK -> see how we do it in DrizzleORM
    const workerId = req.workerId;
    const worker = await db.select().from(workers)
    .where(
        eq(workers.id, Number(workerId))
    )

    if(!worker) {
        res.status(403).json({message:'User not found'})
        return
    }

    const address = worker[0]?.address;

    // logic here to create txn
    // @solana/web3.js 
    // new transaction

    // -> before transfering the txn to blockchain we ->
    // pending amount -> locked amount.....

    await db.transaction( async (tx)=>{
        await tx.update(workers).set({
            lockedAmount: sql`${workers.lockedAmount} + ${worker[0].pendingAmount}`,
            pendingAmount: sql`${workers.pendingAmount} - ${worker[0].pendingAmount}`
        }).where(eq(workers.id, Number(worker[0].id)));

        await tx.insert(payouts).values({
            userId: Number(workerId),
            amount: worker[0].lockedAmount,
            signature: txnId,
            status: 'Processing'
            });

        await tx.update(payouts).set({
            userId: workerId,
            amount: worker[0].lockedAmount,
            signature: txnId,
            status:'Processing'
        })
    })

    // NOW WE CAN SEND TXN TO BLOCKCHAIN => specificall after doing all the local server work
    // as we dont want to process the Blkchn txn before in case server goes down monwy goes boom! 
    
    // txn1(find worker)+ txn2(pending-- & lcoked++) +txn3(send txn to blockchain)
    // if fails everything fails and works then everything works!!!!

    res.json({
        status:"Transaction Success",
        amount: worker[0].pendingAmount,
        Locked: worker[0].lockedAmount
    })
})

// get balance -> locked + pending
router.get('/balance', workerAuthMiddleware as RequestHandler, async (req, res)=>{
    const workerId = req.workerId;

    const [worker] = await db.select().from(workers)
    .where(eq(workers.id, Number(workerId)));

    res.json({
        PendingAmount: worker.pendingAmount,
        LockedAmount : worker.lockedAmount
    })
    return;
})

// Submissions endpoint
router.post('/submissions', workerAuthMiddleware as RequestHandler, async (req, res) => {
    const workerId = req.workerId;
    const parsed = createSubmissionInput.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Invalid submission input' });
        return;
    }
    // Verifying taskId against nextTask
    const taskData = await getNextTask(workerId!);
    if (!taskData || taskData.task.id != parsed.data.taskId) {
        res.status(411).json({ message: 'Incorrect task Id' });
        return;
    }

    const amount = (taskData.task.amount)/total_submissions;

    const created =  await db.transaction(async (tx)=>{
        // txn1 -> inserting in submissions......
        const created = await tx.insert(submissions)
        .values({
            workerId: workerId!,
            optionId: Number(parsed.data.selection),
            taskId: parsed.data.taskId,
            amount: Number(amount)
        })
        .returning();

        // txn2 -> update workers table to show pending amounts!
        await tx.update(workers)
        .set({
            pendingAmount: sql`${workers.pendingAmount} + ${amount}`
        })
        .where(eq(workers.id, Number(workerId)));

        return created;
    })
    const nextTask = await getNextTask(workerId!);
    res.status(201).json({nextTask, 'amount-received': amount  });
    
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