import { Injectable } from "@nestjs/common";

import { createTalk, db, listTalks, type TalkRecord } from "./prisma/talks.ts";

@Injectable()
export class PrismaService {
  readonly db = db;

  listTalks(limit = 50): Promise<TalkRecord[]> {
    return listTalks(limit);
  }

  createTalk(input: { title: string; speaker: string }): Promise<TalkRecord> {
    return createTalk(input);
  }
}
