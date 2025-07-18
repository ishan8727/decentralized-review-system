"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config();
const express_1 = __importDefault(require("express"));
const userRouter_1 = __importDefault(require("./routers/userRouter"));
const workerRouter_1 = __importDefault(require("./routers/workerRouter"));
const app = (0, express_1.default)();
// Middleware to parse JSON request bodies
app.use(express_1.default.json());
app.use('/v1/user', userRouter_1.default);
app.use('/v1/worker', workerRouter_1.default);
app.listen(3030, () => {
    console.log("Server is running on port 3030");
});
