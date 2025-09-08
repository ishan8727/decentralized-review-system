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
const drizzle_orm_1 = require("drizzle-orm");
const postgres_js_1 = require("drizzle-orm/postgres-js");
const postgres_1 = __importDefault(require("postgres"));
const auth_1 = require("../Middlewares/auth");
const schema = __importStar(require("../db/schema"));
const databse_1 = require("../db/databse");
const validate_1 = require("../validate");
// Destructure all tables from schema
const { workers, tasks, options, submissions } = schema;
// Initialize Drizzle with schema
const client = (0, postgres_1.default)(process.env.DATABASE_URL);
const db = (0, postgres_js_1.drizzle)(client, { schema });
const JWT_WORKER = (process.env.JWT_SECRET || '') + 'RandomString123';
const router = (0, express_1.Router)();
const total_submissions = 100;
router.post('/payout', auth_1.workerAuthMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    console.log('UserId: ', Number(req.userId));
    console.log('worker_id:', Number(req.workerId));
    res.end();
}));
// get balance -> locked + pending
router.get('/balance', auth_1.workerAuthMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const workerId = req.workerId;
    const [worker] = yield db.select().from(workers)
        .where((0, drizzle_orm_1.eq)(workers.id, Number(workerId)));
    res.json({
        PendingAmount: worker.pendingAmount,
        LockedAmount: worker.lockedAmount
    });
    return;
}));
// Submissions endpoint
router.post('/submissions', auth_1.workerAuthMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const workerId = req.workerId;
    const parsed = validate_1.createSubmissionInput.safeParse(req.body);
    if (!parsed.success) {
        res.status(400).json({ error: 'Invalid submission input' });
        return;
    }
    // Verifying taskId against nextTask
    const taskData = yield (0, databse_1.getNextTask)(workerId);
    if (!taskData || taskData.task.id != parsed.data.taskId) {
        res.status(411).json({ message: 'Incorrect task Id' });
        return;
    }
    const amount = (taskData.task.amount) / total_submissions;
    const created = yield db.transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
        // txn1 -> inserting in submissions......
        const created = yield tx.insert(submissions)
            .values({
            workerId: workerId,
            optionId: Number(parsed.data.selection),
            taskId: parsed.data.taskId,
            amount: Number(amount)
        })
            .returning();
        // txn2 -> update workers table to show pending amounts!
        yield tx.update(workers)
            .set({
            pendingAmount: (0, drizzle_orm_1.sql) `${workers.pendingAmount} + ${amount}`
        })
            .where((0, drizzle_orm_1.eq)(workers.id, Number(workerId)));
        return created;
    }));
    const nextTask = yield (0, databse_1.getNextTask)(workerId);
    res.status(201).json({ nextTask, 'amount-received': amount });
}));
router.get('/nextTask', auth_1.workerAuthMiddleware, (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const workerId = req.workerId;
    if (!workerId) {
        res.status(401).json({ message: 'workerId not found!' });
        return;
    }
    try {
        const nextTask = yield (0, databse_1.getNextTask)(workerId);
        res.json(nextTask);
        if (!nextTask) {
            res.status(401).json({ message: "No tasks available!" });
            return;
        }
    }
    catch (error) {
        res.status(401).json({ message: 'Error fetching next task!' });
        console.log(error);
        return;
    }
}));
router.post('/signin', (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    const hardcodedAddress = '0x779c7FF70C424B0A494bF524Fd4a021833D8B5bd';
    try {
        const worker = yield db.query.workers.findFirst({
            where: (0, drizzle_orm_1.eq)(workers.address, hardcodedAddress)
        });
        let existingWorker = worker;
        if (!existingWorker) {
            const [newWorker] = yield db.insert(workers)
                .values({
                address: hardcodedAddress,
                pendingAmount: 0,
                lockedAmount: 0
            })
                .returning();
            existingWorker = newWorker;
            console.log(`Created new user ${newWorker}! and -> ${existingWorker}`);
        }
        const token = jsonwebtoken_1.default.sign({ workerId: existingWorker.id }, JWT_WORKER, { expiresIn: '7d' });
        console.log(`Token generated! ${token}`);
        res.json({ token });
    }
    catch (error) {
        console.error('Error during worker sign-in:', error);
        res.status(500).json({ error: 'Internal server error during sign-in' });
    }
}));
exports.default = router;
