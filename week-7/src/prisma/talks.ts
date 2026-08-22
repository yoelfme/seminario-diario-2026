import { db } from "./db.ts";
import { seed } from "./seed.ts";

export { db };

export async function listTalks(limit = 50) {
  await seed();
  const talks = await db.orm.public.Talk.select(
    "id",
    "title",
    "speaker",
    "createdAt",
  )
    .take(limit)
    .all();

  return talks.map((talk) => ({
    id: talk.id,
    title: talk.title,
    speaker: talk.speaker,
    createdAt: talk.createdAt,
  }));
}

export async function createTalk(input: { title: string; speaker: string }) {
  await connectAndEnsureSeed();
  const talk = await db.orm.public.Talk.create({
    title: input.title,
    speaker: input.speaker,
  });

  return {
    id: talk.id,
    title: talk.title,
    speaker: talk.speaker,
    createdAt: talk.createdAt,
  };
}

async function connectAndEnsureSeed() {
  await seed();
}

export type TalkRecord = Awaited<ReturnType<typeof listTalks>>[number];
