"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
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
const postgres_js_1 = require("drizzle-orm/postgres-js");
const postgres_1 = __importDefault(require("postgres"));
const schema_1 = require("../db/schema");
const drizzle_orm_1 = require("drizzle-orm");
// Initialize Drizzle with schema
const client = (0, postgres_1.default)(process.env.DATABASE_URL);
const schema = __importStar(require("../db/schema"));
const db = (0, postgres_js_1.drizzle)(client, { schema });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const client_s3_1 = require("@aws-sdk/client-s3");
const s3_request_presigner_1 = require("@aws-sdk/s3-request-presigner");
const auth_1 = require("../Middlewares/auth");
const validate_1 = require("../validate");
const databse_1 = require("../db/databse");
const router = (0, express_1.Router)();
// user polls responses on the task
router.get('/task', auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const taskId = Number(req.query.taskId);
    // @ts-ignore
    const userId = Number(req.userId);
    // Get the task + its options
    const taskDetailsRaw = yield db
        .select({
        task: {
            id: schema_1.tasks.id,
            title: schema_1.tasks.title,
            userId: schema_1.tasks.userId,
            signature: schema_1.tasks.signature,
            amount: schema_1.tasks.amount,
            done: schema_1.tasks.done
        },
        option: {
            id: schema_1.options.id,
            imageUrl: schema_1.options.imageUrl,
            taskId: schema_1.options.taskId
        }
    })
        .from(schema_1.tasks)
        .leftJoin(schema_1.options, (0, drizzle_orm_1.eq)(schema_1.options.taskId, schema_1.tasks.id))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.tasks.userId, userId), (0, drizzle_orm_1.eq)(schema_1.tasks.id, taskId)));
    if (taskDetailsRaw.length === 0) {
        res.status(401).json({ message: "You dont have access to this task!!!!" });
        return;
    }
    // Re-shape taskDetails to have `options` array like Prisma's include
    const taskDetails = Object.assign(Object.assign({}, taskDetailsRaw[0].task), { options: taskDetailsRaw
            .filter(row => row.option && row.option.id !== null)
            .map(row => ({
            id: row.option.id,
            image_url: row.option.imageUrl,
            task_id: row.option.taskId
        })) });
    //  Get all submissions for this task with joined option
    const responses = yield db
        .select({
        id: schema_1.submissions.id,
        taskId: schema_1.submissions.taskId,
        optionId: schema_1.submissions.optionId,
        option: {
            id: schema_1.options.id,
            imageUrl: schema_1.options.imageUrl
        }
    })
        .from(schema_1.submissions)
        .where((0, drizzle_orm_1.eq)(schema_1.submissions.taskId, taskId))
        .leftJoin(schema_1.options, (0, drizzle_orm_1.eq)(schema_1.submissions.optionId, schema_1.options.id));
    //  Build the `result` object like in Prisma version
    const result = {};
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
}));
// user puts tasks from here
router.post('/task', auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const body = req.body;
    const validation = validate_1.imageValidate.safeParse(body);
    if (!validation.success) {
        res.status(400).json({ error: 'Invalid input', details: validation.error });
        return;
    }
    // parse signature here to check valid transaction
    const data = validation.data;
    try {
        const result = yield db.transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const [newTask] = yield tx.insert(schema_1.tasks).values({
                title: data.title,
                userId: req.userId,
                signature: 'placeholder',
                amount: 100 * databse_1.TOTAL_DECIMALS,
                done: false
            }).returning();
            yield tx.insert(schema_1.options).values(data.options.map(x => ({
                imageUrl: x.imageurl,
                taskId: newTask.id
            })));
            return newTask;
        }));
        res.json({ id: result.id });
    }
    catch (err) {
        console.error('Transaction error:', err);
        res.status(500).json({ error: 'Internal server error' });
    }
}));
router.get("/presignUrl", auth_1.authMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        console.log(`Presigned URL: ${preSignedUrl}`);
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
        const user = yield db.query.users.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.users.address, hardcodedAddress)
        });
        let existingUser = user;
        // create one if not found
        if (!existingUser) {
            const [newUser] = yield db.insert(schema_1.users)
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
