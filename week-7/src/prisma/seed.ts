import { connectDatabase, db } from "./db.ts";

const talks = [
  {
    title: "NestJS request lifecycle",
    speaker: "Ana López",
  },
  {
    title: "PostgreSQL as source of truth",
    speaker: "Bruno Díaz",
  },
  {
    title: "Prisma 8 contracts and migrations",
    speaker: "Carla Méndez",
  },
];

let pendingSeed: Promise<void> | undefined;

async function runSeed(): Promise<void> {
  await connectDatabase();

  for (const talk of talks) {
    const existing = await db.orm.public.Talk.where({
      title: talk.title,
    }).first();

    if (!existing) {
      await db.orm.public.Talk.create(talk);
    }
  }
}

export function seed(): Promise<void> {
  pendingSeed ??= runSeed().catch((error: unknown) => {
    pendingSeed = undefined;
    throw error;
  });
  return pendingSeed;
}

export async function seedTalks(): Promise<{ count: number }> {
  pendingSeed = undefined;
  await runSeed();
  const all = await db.orm.public.Talk.all();
  return { count: all.length };
}
