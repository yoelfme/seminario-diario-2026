import { readFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import postgres from "postgres";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/postgres";

const sql = postgres(databaseUrl, { max: 1 });
const schemaPath = join(dirname(fileURLToPath(import.meta.url)), "schema.sql");

async function main() {
  const schema = readFileSync(schemaPath, "utf8");
  await sql.unsafe(schema);
  console.log("Schema applied.");
  await sql.end();
}

main().catch(async (error) => {
  console.error(error);
  await sql.end({ timeout: 1 });
  process.exit(1);
});
