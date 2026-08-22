import { Injectable, type NestMiddleware } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import type { NextFunction, Response } from "express";

import {
  type LifecycleRequest,
  pushLifecycle,
} from "./lifecycle.ts";

@Injectable()
export class LifecycleMiddleware implements NestMiddleware {
  use(req: LifecycleRequest, _res: Response, next: NextFunction): void {
    req.requestId = randomUUID().slice(0, 8);
    req.lifecycle = [];
    pushLifecycle(req, "01 Middleware");
    next();
  }
}
