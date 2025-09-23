import express, {
  type NextFunction,
  type Request,
  type Response,
} from "express";
import cors from "cors"
import globalErrorHandler from "./middlewares/globalErrorHandler.js";
import userRouter from "./user/userRouter.js";
import bookRouter from "./book/bookRouter.js";
import { config } from "./config/config.js";

const app = express();

app.use(express.json())
app.use(cors({
  origin: config.frontendDomain,
}))

app.get("/", (req: Request, res: Response, next: NextFunction) => {
  res.json({
    message: "Welcome to elib apis",
  });
});

app.use("/api/users", userRouter)

app.use("api/books", bookRouter)

// Global error handler (provided in express)
app.use(globalErrorHandler);

export default app;
