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
exports.getNextTask = exports.db = void 0;
const node_postgres_1 = require("drizzle-orm/node-postgres");
const pg_1 = require("pg");
const schema = __importStar(require("./schema"));
const path_1 = __importDefault(require("path"));
const dotenv_1 = __importDefault(require("dotenv"));
const { workers, tasks, submissions, options } = schema;
const drizzle_orm_1 = require("drizzle-orm");
// Load env from backend root folder
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../../.env') });
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL is not defined in the environment variables.");
}
const pool = new pg_1.Pool({ connectionString: process.env.DATABASE_URL });
exports.db = (0, node_postgres_1.drizzle)(pool);
const getNextTask = (worker_Id) => __awaiter(void 0, void 0, void 0, function* () {
    const workerId = worker_Id;
    if (!workerId) {
        console.log("'Unauthorized no workerId");
        return;
    }
    // First, find a task that meets the criteria
    // Use LEFT JOIN + isNull to find tasks with no submission by this worker
    const taskTbd = yield exports.db
        .select({
        id: tasks.id,
        title: tasks.title,
        amount: tasks.amount
    })
        .from(tasks)
        .leftJoin(submissions, (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(submissions.taskId, tasks.id), (0, drizzle_orm_1.eq)(submissions.workerId, workerId)))
        .where((0, drizzle_orm_1.and)((0, drizzle_orm_1.isNull)(submissions.id), (0, drizzle_orm_1.eq)(tasks.done, false)))
        .limit(1);
    if (taskTbd.length === 0) {
        console.log(" No tasks available");
        return;
    }
    const task = taskTbd[0]; // Get the first (and only) task
    // Then, get the options for this specific task
    const taskOptions = yield exports.db.select()
        .from(options)
        .where((0, drizzle_orm_1.eq)(options.taskId, task.id)); // Use task.id, not tasks.id
    return ({
        task: {
            id: task.id,
            title: task.title,
            amount: task.amount,
            options: taskOptions
        }
    });
});
exports.getNextTask = getNextTask;
