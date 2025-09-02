import { NextFunction, Router, Request, Response, RequestHandler } from 'express'
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv'
dotenv.config();

const authMiddleware = (req: Request, res: Response, next:NextFunction) => {

    const authHeaders = req.headers['authorization'];
    
    if (!authHeaders) return res.status(401).json({message:"Unauthorized Request!"});
    
    const token = authHeaders.split(' ')[1];

    try {
        const verified = jwt.verify(token, process.env.JWT_SECRET!) as any;
        
        if(verified.userId){
            // @ts-ignore
            req.userId = verified.userId;
            next();
            return;
        }
        else{
            res.status(401).json({message:"token not valid!"});
            return;
        }

    } catch (error) {
        res.status(401).json({message:"Unauthorized token request!"});
        return;
    }
}

// worker authenticaion!

const WORKER_TOKEN_JWT = process.env.JWT_SECRET + "RandomString123";

const workerAuthMiddleware = (req: Request, res: Response, next:NextFunction)=>{
    const authheaders = req.headers['authorization'];

    if(!authheaders) return res.status(401).json({ message: "Unauthorized Request!" });

    const token = authheaders.split(' ')[1];

    try {
        const verified = jwt.verify(token, WORKER_TOKEN_JWT) as any;

        if (verified.workerId){
            // @ts-ignore
            req.workerId = verified.workerId;
            next();
            return;
        }else{
            return res.status(401).json({ message: "Token not valid!" });
        }
    } catch (error) {
        return res.status(401).json({message:"Token not valid!"});
    }

}

export {authMiddleware, workerAuthMiddleware};

