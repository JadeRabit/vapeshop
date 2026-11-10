import fs from "node:fs";
import path from "node:path";
import EmbeddedPostgres from "embedded-postgres";

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl) {
  console.error("DATABASE_URL is missing. Add it to .env before starting the database.");
  process.exit(1);
}

const url = new URL(databaseUrl);
const port = Number(url.port || 5432);
const user = decodeURIComponent(url.username);
const password = decodeURIComponent(url.password);
const database = decodeURIComponent(url.pathname.replace(/^\//, ""));

if (!user || !password || !database) {
  console.error("DATABASE_URL must include a username, password, and database name.");
  process.exit(1);
}

if (url.hostname !== "localhost" && url.hostname !== "127.0.0.1") {
  console.error(
    `DATABASE_URL points to "${url.hostname}". The local database runner only supports localhost.`,
  );
  process.exit(1);
}

const dataDir = path.resolve(process.env.PGDATA_DIR ?? ".data/postgres");
const isInitialised = fs.existsSync(path.join(dataDir, "PG_VERSION"));

const pg = new EmbeddedPostgres({
  databaseDir: dataDir,
  port,
  user,
  password,
  persistent: true,
  initdbFlags: ["--encoding=UTF8", "--locale=C"],
  onLog: (message) => process.stdout.write(`[postgres] ${message}`),
  onError: (error) => console.error("[postgres]", error),
});

if (!isInitialised) {
  console.log(`Initialising local PostgreSQL cluster in ${dataDir}...`);
  await pg.initialise();
}

await pg.start();
console.log(`PostgreSQL is listening on ${url.hostname}:${port}.`);

const client = pg.getPgClient("postgres");
await client.connect();
const existing = await client.query("SELECT 1 FROM pg_database WHERE datname = $1", [database]);
await client.end();

if (existing.rowCount === 0) {
  await pg.createDatabase(database);
  console.log(`Created database "${database}".`);
}

console.log(`Database "${database}" is ready for user "${user}".`);
console.log("Keep this process running while developing. Press Ctrl+C to stop.");
