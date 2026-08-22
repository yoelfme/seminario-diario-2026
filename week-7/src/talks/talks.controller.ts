import { Body, Controller, Get, Inject, Post, Query, Req } from "@nestjs/common";

import {
  type LifecycleRequest,
  pushLifecycle,
} from "../lifecycle/lifecycle.ts";
import { LifecyclePipe } from "../lifecycle/lifecycle.pipe.ts";
import type { CreateTalkDto } from "./create-talk.dto.ts";
import { CreateTalkValidationPipe } from "./create-talk.validation-pipe.ts";
import { TalksService } from "./talks.service.ts";

@Controller("talks")
export class TalksController {
  constructor(@Inject(TalksService) private readonly talksService: TalksService) {}

  @Get()
  findAll(
    @Req() req: LifecycleRequest,
    // Forces the pipe stage to run on GET (no body to validate).
    @Query(LifecyclePipe) _lifecycle?: string,
  ) {
    pushLifecycle(req, "05 Controlador");
    return this.talksService.findAll(req);
  }

  @Post()
  create(
    @Req() req: LifecycleRequest,
    @Body(LifecyclePipe, CreateTalkValidationPipe) body: CreateTalkDto,
  ) {
    pushLifecycle(req, "05 Controlador");
    return this.talksService.create(req, body);
  }
}
