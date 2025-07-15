import { Router } from "express";
import jwt from "jsonwebtoken";
import db from '../db/databse'; 
import { users } from "../db/schema";
import { eq } from "drizzle-orm";
const router = Router();

const SECRET_KEY = "abcd1234"

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
        if (!user) {
            const [newUser] = await db.insert(users)
                .values(
                    {
                        address: hardcodedAddress
                    })
                    .returning();

            existingUser = newUser;
        }

        if (!existingUser) {
            throw new Error("Failed to create or retrieve the user.");
        }

        // assign the token
        const token = jwt.sign(
            {
                userId: existingUser.id
            },
            SECRET_KEY
        );

        res.json(token);

        

    } catch (error) {
        console.error("Error during user sign-in:", error);
        res.status(500).json({ error: "Internal server error during sign-in" });
    }



});

export default router;