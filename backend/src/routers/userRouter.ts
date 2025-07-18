import { Router, Request, Response, RequestHandler } from "express";
import jwt from "jsonwebtoken";
import db from '../db/databse';
import { users } from "../db/schema";
import { eq } from "drizzle-orm";

import dotenv from 'dotenv';
dotenv.config();

import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import authMiddleware from "../Middlewares/auth";


const router = Router();

router.get("/presignUrl", authMiddleware as RequestHandler, async (req: Request, res: Response) => {
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

        console.log(preSignedUrl);
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