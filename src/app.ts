import express from "express";
import cors from "cors";
import morgan from "morgan";
import socialMediaRoutes from "./routes/socialMedia.routes";
import { errorHandler } from "./errors/errorHandler";

const app = express();

app.use(cors());
app.use(express.json({ limit: "2mb" }));
app.use(morgan("dev"));

app.get("/health", (_req, res) => res.json({ ok: true }));

app.use("/api/v1/social-media", socialMediaRoutes);

// error handler
app.use(errorHandler);

export default app;
