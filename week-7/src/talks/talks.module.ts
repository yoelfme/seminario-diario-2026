import { Module } from "@nestjs/common";

import { PrismaService } from "../prisma.service.ts";
import { TalksController } from "./talks.controller.ts";
import { TalksService } from "./talks.service.ts";

@Module({
  controllers: [TalksController],
  providers: [PrismaService, TalksService],
})
export class TalksModule {}
