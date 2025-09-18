import type { NextFunction, Request, Response } from "express";
import createHttpError from "http-errors";
import userModel from "./userModel.js";

const createUser = async (req: Request, res: Response, next: NextFunction) => {
    const {name, email, password} = req.body;

    // validation
    if(!name || !email || !password){
        const error = createHttpError(400, "All fields are required")
        return next(error)
    }

    // db call
    const user = await userModel.findOne({email})
    if(user){
        const error = createHttpError(400, "Email registered already")
        return next(error)
    }

    // process

    // response
}

export { createUser }