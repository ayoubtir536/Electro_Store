import { app, initDBCache } from "../server";

let isDbInitialized = false;

// Middleware to ensure DB is initialized in serverless environments
app.use(async (req, res, next) => {
  if (!isDbInitialized) {
    try {
      await initDBCache();
      isDbInitialized = true;
    } catch (err) {
      console.error("Failed to initialize database cache in serverless function:", err);
    }
  }
  next();
});

export default app;
