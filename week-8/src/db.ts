import postgres from "postgres";

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgres://postgres:postgres@localhost:5432/postgres";

export const sql = postgres(databaseUrl, {
  max: 10,
  idle_timeout: 20,
  connect_timeout: 10,
});

export async function pingDb(): Promise<boolean> {
  await sql`SELECT 1`;
  return true;
}
