"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const databse_1 = __importDefault(require("../db/databse"));
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const auth_1 = __importDefault(require("../Middlewares/auth"));
const router = (0, express_1.Router)();
router.get("/presignUrl", auth_1.default, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const s3Client = new client_s3_1.S3Client({
            credentials: {
                accessKeyId: process.env.AWS_ACCESS_KEY_ID,
                secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
            },
            region: 'eu-north-1'
        });
        const command = new client_s3_1.PutObjectCommand({
            Bucket: 'decentralized.review.system',
            Key: `Decentralised-App-Files/${req.userId}/${Date.now()}.jpg`
        });
        const preSignedUrl = yield (0, s3_request_presigner_1.getSignedUrl)(s3Client, command, {
            expiresIn: 36000
        });
        console.log(preSignedUrl);
        res.json({ preSignedUrl });
    }
    catch (error) {
        console.error("Error generating presigned URL:", error);
        res.status(500).json({ error: "Failed to generate presigned URL" });
    }
}));
// TODO signup with the wallet address
// TODO signing an address
router.post("/signin", (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hardcodedAddress = "0x779c7FF70C424B0A494bF524Fd4a021833D8B5bd";
    try {
        // find the user
        const user = yield databse_1.default.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.users.address, hardcodedAddress)
        });
        let existingUser = user;
        // create one if not found
        if (!existingUser) {
            const [newUser] = yield databse_1.default.insert(schema_1.users)
                .values({
                address: hardcodedAddress
            })
                .returning();
            existingUser = newUser;
            console.log(`Created new user ${newUser}! and -> ${existingUser}`);
        }
        // assign the token
        const token = jsonwebtoken_1.default.sign({
            userId: existingUser.id
        }, process.env.JWT_SECRET);
        console.log(`Token generated! ${token}`);
        res.json(token);
    }
    catch (error) {
        console.error("Error during user sign-in:", error);
        res.status(500).json({ error: "Internal server error during sign-in" });
    }
}));
exports.default = router;
