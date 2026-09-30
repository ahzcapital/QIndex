import { Pool } from "pg";

declare global {
  // eslint-disable-next-line no-var
  var qindexPool: Pool | undefined;
}

export const pool =
  global.qindexPool ??
  new Pool({
    connectionString: process.env.DATABASE_URL,
    max: 3,
    ssl: process.env.DATABASE_URL?.includes("localhost")
      ? false
      : { rejectUnauthorized: false },
  });

if (process.env.NODE_ENV !== "production") global.qindexPool = pool;
