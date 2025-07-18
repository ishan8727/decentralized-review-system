import dotenv from 'dotenv';
dotenv.config();

import express from "express";
import userRouter from "./routers/userRouter";
import workerRouter from "./routers/workerRouter";

const app = express();

// Middleware to parse JSON request bodies
app.use(express.json());

app.use('/v1/user', userRouter);
app.use('/v1/worker', workerRouter);

app.listen(3030, () => {
    console.log("Server is running on port 3030");
});