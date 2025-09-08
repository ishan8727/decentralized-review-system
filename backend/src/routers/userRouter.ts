import { Router, Request, Response, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { tasks, users, options , submissions } from "../db/schema";
import { eq, and } from "drizzle-orm";

// Initialize Drizzle with schema
const client = postgres(process.env.DATABASE_URL!);
import * as schema from "../db/schema";
const db = drizzle(client, { schema });

import dotenv from 'dotenv';
dotenv.config();

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import { authMiddleware } from "../Middlewares/auth";
import {imageValidate} from "../validate";
import { TOTAL_DECIMALS } from "../db/databse";
const router = Router();

// user polls responses on the task
router.get('/task', authMiddleware as unknown as RequestHandler, async (req: Request, res: Response): Promise<void> => {   // @ts-ignore
    const taskId = Number(req.query.taskId);
    // @ts-ignore
    const userId = Number(req.userId);

    // Get the task + its options
    const taskDetailsRaw = await db
        .select({
            task: {
                id: tasks.id,
                title: tasks.title,
                userId: tasks.userId,
                signature: tasks.signature,
                amount: tasks.amount,
                done: tasks.done
            },
            option: {
                id: options.id,
                imageUrl: options.imageUrl,
                taskId: options.taskId
            }
        })
        .from(tasks)
        .leftJoin(options, eq(options.taskId, tasks.id))
        .where(
            and(
                eq(tasks.userId, userId),
                eq(tasks.id, taskId)
            )
        );

    if (taskDetailsRaw.length === 0) {
        res.status(401).json({ message: "You dont have access to this task!!!!" });
        return;
    }

    // Re-shape taskDetails to have `options` array like Prisma's include
    const taskDetails = {
        ...taskDetailsRaw[0].task,
        options: taskDetailsRaw
            .filter(row => row.option && row.option.id !== null)
            .map(row => ({
                id: row.option!.id,
                image_url: row.option!.imageUrl,
                task_id: row.option!.taskId
            }))
    };

    //  Get all submissions for this task with joined option
    const responses = await db
        .select({
            id: submissions.id,
            taskId: submissions.taskId,
            optionId: submissions.optionId,
            option: {
                id: options.id,
                imageUrl: options.imageUrl
            }
        })
        .from(submissions)
        .where(eq(submissions.taskId, taskId))
        .leftJoin(options, eq(submissions.optionId, options.id));

    //  Build the `result` object like in Prisma version
    const result: Record<string, { count: number; option: { imageUrl: string } }> = {};

    taskDetails.options.forEach(option => {
        result[option.id] = {
            count: 0,
            option: {
                imageUrl: option.image_url
            }
        };
    });

    responses.forEach(r => {
        if (result[r.optionId]) {
            result[r.optionId].count++;
        }
    });

    res.json({
        result,
        taskDetails
    });
});


// user puts tasks from here
router.post('/task', authMiddleware as unknown as RequestHandler , async (req: Request, res: Response) => {
    const body = req.body;

                const validation = imageValidate.safeParse(body);
                if (!validation.success) {
                    res.status(400).json({ error: 'Invalid input', details: validation.error});
                    return;
                }

    // parse signature here to check valid transaction
                const data = validation.data;
                try {

                    const result = await db.transaction(async (tx) => {
                        const [newTask] = await tx.insert(tasks).values({
                            title: data.title,
                            userId: (req as any).userId,
                            signature: 'placeholder',
                            amount: 100 * TOTAL_DECIMALS,
                            done: false
                        }).returning();

                        await tx.insert(options).values(
                            data.options.map(x => ({
                                imageUrl: x.imageurl,
                                taskId: newTask.id
                            }))
                        );

                        return newTask;
                    });

                    res.json({ id: result.id });

                } catch (err) {
                    console.error('Transaction error:', err);
                    res.status(500).json({ error: 'Internal server error' });
                }
});


router.get("/presignUrl", authMiddleware as unknown as RequestHandler, async (req: Request, res: Response) => {
    try {
        const s3Client = new S3Client({
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!
            },
            region: 'eu-north-1'
        });

        const command = new PutObjectCommand({
            Bucket: 'decentralized.review.system',
            Key: `Decentralised-App-Files/${(req as any).userId}/${Date.now()}.jpg`
        });

        const preSignedUrl = await getSignedUrl(s3Client, command, {
            expiresIn: 36000
        })

        console.log(`Presigned URL: ${preSignedUrl}`);
        res.json({ preSignedUrl });

    } catch (error) {
        console.error("Error generating presigned URL:", error);
        res.status(500).json({ error: "Failed to generate presigned URL" });
    }

});


// TODO signup with the wallet address
// TODO signing an address
router.post("/signin", async (req, res) => {

    const hardcodedAddress = "0x779c7FF70C424B0A494bF524Fd4a021833D8B5bd";

    try {
        // find the user
        const user = await db.query.users.findFirst({
            where: eq(users.address, hardcodedAddress)
        });

        let existingUser = user;

        // create one if not found
        if (!existingUser) {
            const [newUser] = await db.insert(users)
                .values(
                    {
                        address: hardcodedAddress
                    })
                .returning();

            existingUser = newUser;

            console.log(`Created new user ${newUser}! and -> ${existingUser}`);
        }

        // assign the token
        const token = jwt.sign(
            {
                userId: existingUser.id
            },
            process.env.JWT_SECRET!
        );

        console.log(`Token generated! ${token}`);
        res.json(token);

    } catch (error) {
        console.error("Error during user sign-in:", error);
        res.status(500).json({ error: "Internal server error during sign-in" });
    }
});

export default router;
