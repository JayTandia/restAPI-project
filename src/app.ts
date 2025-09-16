import express, { type NextFunction, type Request, type Response } from 'express';
import globalErrorHandler from './middlewares/globalErrorHandler.js';

const app = express();

app.get("/", (req, res, next) => {
    res.json({
        message: "Welcome to elib apis"
    })
})

// Global error handler (provided in express)
app.use(globalErrorHandler)

export default app;