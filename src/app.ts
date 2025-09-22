import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import globalErrorHandler from "./middlewares/globalErrorHandler.js";
import userRouter from "./user/userRouter.js";
import bookRouter from "./book/bookRouter.js";

const app = express();

app.use(express.json())

app.get("/", (req, res, next) => {
  res.json({
    message: "Welcome to elib apis",
  });
});

app.use("/api/users", userRouter)

app.use("api/books", bookRouter)

// Global error handler (provided in express)
app.use(globalErrorHandler);

export default app;
