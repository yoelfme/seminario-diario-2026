import { Inject, Injectable } from "@nestjs/common";

import {
  type LifecycleRequest,
  pushLifecycle,
} from "../lifecycle/lifecycle.ts";
import { PrismaService } from "../prisma.service.ts";

@Injectable()
export class TalksService {
  constructor(@Inject(PrismaService) private readonly prisma: PrismaService) {}

  findAll(req: LifecycleRequest) {
    pushLifecycle(req, "06 Servicio");
    return this.prisma.listTalks(50);
  }

  create(req: LifecycleRequest, input: { title: string; speaker: string }) {
    pushLifecycle(req, "06 Servicio");
    return this.prisma.createTalk(input);
  }
}
