# Config (`src/config`)

Core configuration files loaded by the Express server.

## Files

| File | Purpose |
| --- | --- |
| `env.ts` | Validates required environment variables (`MONGODB_URI`, `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, etc.) at startup using Zod |
| `db.ts` | Connects to MongoDB via Mongoose and caches the connection globally across serverless requests |
| `cors.ts` | Configures allowed browser origins (`FRONTEND_URL` in production; `localhost`/`127.0.0.1` in non-production) with `credentials: true` |
| `rbac.ts` | Defines the 3 workspace roles (`admin`, `manager`, `viewer`) and maps each role to its allowed permissions |
