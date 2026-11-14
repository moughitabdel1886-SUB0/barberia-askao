import "dotenv/config";
import path from "node:path";
import { createServer } from "node:http";
import express from "express";
import { drizzle } from "drizzle-orm/mysql2";
import { migrate } from "drizzle-orm/mysql2/migrator";
import { sql } from "drizzle-orm";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { appRouter } from "../routers";
import { getDb } from "../db";
import { seedDefaults } from "../seed";
import { registerUploadRoute } from "../upload";
import { createContext } from "./context";
import { publicPlatformScript } from "./publicConfig";
import { registerStorageProxy } from "./storageProxy";
import { serveStatic, setupVite } from "./vite";

async function prepareDatabase() {
  if (!process.env.DATABASE_URL) {
    console.warn("[db] DATABASE_URL missing; starting without database preparation.");
    return;
  }

  const db = drizzle(process.env.DATABASE_URL);
  try {
    if (process.env.RUN_MIGRATIONS === "0") {
      console.log("[db] Automatic migrations disabled (RUN_MIGRATIONS=0).");
    } else {
      await migrate(db, { migrationsFolder: path.resolve(process.cwd(), "drizzle") });
      console.log("[db] Migrations up to date.");
    }
  } catch (error) {
    console.error("[db] Migration failed:", error);
    throw error;
  }

  await seedDefaults();
}

async function startServer() {
  await prepareDatabase();

  const app = express();
  const server = createServer(app);
  app.disable("x-powered-by");
  const trustProxy = process.env.TRUST_PROXY?.trim();
  if (trustProxy === "false") app.set("trust proxy", false);
  else if (trustProxy && /^\d+$/.test(trustProxy)) app.set("trust proxy", Number(trustProxy));
  else app.set("trust proxy", 1);

  app.use((req, res, next) => {
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    if (req.path.startsWith("/api/")) res.setHeader("Cache-Control", "no-store");
    next();
  });

  // Booking payloads are small; large media travels through the multipart route.
  app.use(express.json({ limit: "2mb" }));
  app.use(express.urlencoded({ limit: "2mb", extended: true }));

  app.get("/api/health", async (_req, res) => {
    try {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      await db.execute(sql`SELECT 1`);
      res.json({ status: "ok" });
    } catch {
      res.status(503).json({ status: "unavailable" });
    }
  });
  // Manus serves managed /manus-storage/ at the edge. Outside Manus, opt in
  // explicitly so uploaded media keeps working behind the app server.
  if (process.env.NODE_ENV === "development" || process.env.MANUS_STORAGE_PROXY === "1") {
    registerStorageProxy(app);
  }
  app.get("/api/platform/config.js", (_req, res) => {
    res.set("Cache-Control", "no-store").type("application/javascript").send(publicPlatformScript());
  });

  registerUploadRoute(app);

  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
    }),
  );

  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const port = Number(process.env.PORT || "3000");
  if (!Number.isInteger(port) || port < 1 || port > 65535) throw new Error("Invalid PORT");
  server.on("error", error => {
    console.error("Server failed:", error.message);
    process.exit(1);
  });
  server.listen(port, "0.0.0.0", () => console.log(`Server listening on port ${port}`));
}

startServer().catch(error => {
  console.error(error);
  process.exit(1);
});
