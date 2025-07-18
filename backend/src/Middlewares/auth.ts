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
            (req as any).userId = verified.userId;
            return next();
        }
        else{
            return res.status(401).json({message:"token not valid!"});
        }

    } catch (error) {
        return res.status(401).json({message:"Unauthorized token request!"});
    }
}

export default authMiddleware;