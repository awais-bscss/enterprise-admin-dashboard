import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import helmet from "helmet";
import { corsOptions } from "./config/cors.js";
import { errorHandler } from "./middleware/errorHandler.js";
import { notFound } from "./middleware/notFound.js";
import { apiRateLimiter } from "./middleware/rateLimiter.js";
import { apiRouter } from "./routes/index.js";

export const app = express();

// Trust first proxy (Vercel) for accurate req.ip and Secure cookie flags.
app.set("trust proxy", 1);
app.disable("x-powered-by");

app.use(helmet());
app.use(cors(corsOptions));
app.use(cookieParser());
app.use(express.json({ limit: "100kb" }));

app.use("/api", apiRateLimiter, apiRouter);

app.use(notFound);
app.use(errorHandler);

export default app;
