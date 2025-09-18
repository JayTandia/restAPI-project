import type { NextFunction, Request, Response } from "express";

const createUser = (req: Request, res: Response, next: NextFunction) => {
    res.json({
        message: "User created from conto=roller",
    })
}

export { createUser }