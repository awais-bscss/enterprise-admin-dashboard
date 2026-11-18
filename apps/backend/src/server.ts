import { app } from "./app.js";
import { connectToDatabase, getDbStatus } from "./config/db.js";
import { env } from "./config/env.js";

async function start() {
  await connectToDatabase();
  app.listen(env.PORT, () => {
    console.log(`API running on http://localhost:${env.PORT} (${env.NODE_ENV}, db: ${getDbStatus()})`);
  });
}

void start();
