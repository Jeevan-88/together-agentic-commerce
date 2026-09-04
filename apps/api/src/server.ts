import "dotenv/config";
import express from "express";
import cors from "cors";

import { createRequire } from "node:module";
import { prisma } from "./lib/prisma.js";
import productsRouter from "./routes/products.js";
import purchasesRouter from "./routes/purchases.js";
import webhooksRouter from "./routes/webhooks.js";
import groupsRouter from "./routes/groups.js";
import auditRouter from "./routes/audit.js";
import authRouter from "./routes/auth.js";
import { authenticateUser } from "./lib/auth.js";

const require = createRequire(import.meta.url);
const helmet = require("helmet") as () => express.RequestHandler;
const app = express();
const PORT = Number(process.env.PORT) || 4000;

app.use(helmet());

const webOrigin = process.env.WEB_ORIGIN;

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (
        origin === webOrigin ||
        origin === "http://localhost:3000" ||
        origin.endsWith(".vercel.app")
      ) {
        return callback(null, true);
      }
      return callback(null, true);
    },
    methods: ["GET", "POST", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);



app.use(
  "/api/webhooks",
  express.raw({ type: "application/json" }),
  webhooksRouter,
);

app.use(express.json());
app.use(authenticateUser);

app.get("/health", (_req, res) => {
  res.json({
    success: true,
    service: "together-api",
  });
});

app.get("/health/database", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.json({
      success: true,
      database: "connected",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(500).json({
      success: false,
      database: "disconnected",
    });
  }
});

app.use("/api/auth", authRouter);
app.use("/api/products", productsRouter);
app.use("/api/purchases", purchasesRouter);
app.use("/api/groups", groupsRouter);
app.use("/api/audit", auditRouter);

app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

if (process.env.VERCEL !== "1") {
  const server = app.listen(PORT, () => {
    console.log(`TOGETHER API running on http://localhost:${PORT}`);
  });

  const shutdown = async () => {
    console.log("Shutting down server...");

    server.close(async () => {
      await prisma.$disconnect();
      process.exit(0);
    });
  };

  process.on("SIGINT", shutdown);
  process.on("SIGTERM", shutdown);
}

export default app;