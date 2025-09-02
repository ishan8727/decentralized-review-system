"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.workerAuthMiddleware = exports.authMiddleware = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const authMiddleware = (req, res, next) => {
    const authHeaders = req.headers['authorization'];
    if (!authHeaders)
        return res.status(401).json({ message: "Unauthorized Request!" });
    const token = authHeaders.split(' ')[1];
    try {
        const verified = jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET);
        if (verified.userId) {
            // @ts-ignore
            req.userId = verified.userId;
            next();
            return;
        }
        else {
            res.status(401).json({ message: "token not valid!" });
            return;
        }
    }
    catch (error) {
        res.status(401).json({ message: "Unauthorized token request!" });
        return;
    }
};
exports.authMiddleware = authMiddleware;
// worker authenticaion!
const WORKER_TOKEN_JWT = process.env.JWT_SECRET + "RandomString123";
const workerAuthMiddleware = (req, res, next) => {
    const authheaders = req.headers['authorization'];
    if (!authheaders)
        return res.status(401).json({ message: "Unauthorized Request!" });
    const token = authheaders.split(' ')[1];
    try {
        const verified = jsonwebtoken_1.default.verify(token, WORKER_TOKEN_JWT);
        if (verified.workerId) {
            // @ts-ignore
            req.workerId = verified.workerId;
            next();
            return;
        }
        else {
            return res.status(401).json({ message: "Token not valid!" });
        }
    }
    catch (error) {
        return res.status(401).json({ message: "Token not valid!" });
    }
};
exports.workerAuthMiddleware = workerAuthMiddleware;
