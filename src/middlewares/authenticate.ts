import type { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import jwt from "jsonwebtoken";
import { config } from "../config/config.js";

export interface AuthRequest extends Request {
    userId: string;
}

const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const token = req.header('Authorization')
    if(!token){
        return next(createHttpError(401, "Authorization token is required"))
    }
   
    try {
         const parsedToken = token.split(" ")[1]
        if(!parsedToken){
            return next(createHttpError(401, "Invalid format token"))
        }

        const decoded = jwt.verify(parsedToken, config.jwtSecret as string)

        const _req = req as AuthRequest
        _req.userId = decoded.sub as string
        next()
    } catch (error) {
        return next(createHttpError(401, "Token expired"))
    }
}

export default authenticate