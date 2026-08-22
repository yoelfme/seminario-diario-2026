import { spawnSync } from "node:child_process";
import { setTimeout as sleep } from "node:timers/promises";

function run(command: string, args: string[], env?: NodeJS.ProcessEnv) {
  const result = spawnSync(command, args, {
    stdio: "inherit",
    env: { ...process.env, ...env },
    shell: false,
  });
  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

const databaseUrl =
  process.env.DATABASE_URL ??
  "postgresql://seminario:seminario@localhost:5433/seminario";

console.log("Resetting Postgres volume and replaying migrations…");
run("docker", ["compose", "down", "-v"]);
run("docker", ["compose", "up", "-d"]);

for (let attempt = 0; attempt < 30; attempt += 1) {
  const ready = spawnSync(
    "docker",
    ["compose", "exec", "-T", "postgres", "pg_isready", "-U", "seminario", "-d", "seminario"],
    { stdio: "ignore" },
  );
  if (ready.status === 0) {
    break;
  }
  await sleep(1000);
  if (attempt === 29) {
    console.error("Postgres did not become ready in time.");
    process.exit(1);
  }
}

run("pnpm", ["exec", "prisma", "migrate", "--yes"], {
  DATABASE_URL: databaseUrl,
});
run("pnpm", ["exec", "tsx", "scripts/seed.ts"], {
  DATABASE_URL: databaseUrl,
});

console.log("Database reset complete.");
