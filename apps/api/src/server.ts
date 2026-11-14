import { app } from "./app.js";
import { connectToDatabase, getDbStatus } from "./config/db.js";
import { env } from "./config/env.js";

async function startServer(): Promise<void> {
  await connectToDatabase();
  const dbStatus = getDbStatus();

  app.listen(env.PORT, () => {
    console.log(
      `[api] Server listening on http://localhost:${env.PORT} (env=${env.NODE_ENV}, db=${dbStatus})`,
    );
  });
}

void startServer();
