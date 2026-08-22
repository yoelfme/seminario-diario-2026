import { Inject, Injectable, Scope, type PipeTransform } from "@nestjs/common";
import { REQUEST } from "@nestjs/core";

import {
  type LifecycleRequest,
  pushLifecycle,
} from "./lifecycle.ts";

@Injectable({ scope: Scope.REQUEST })
export class LifecyclePipe implements PipeTransform {
  constructor(@Inject(REQUEST) private readonly request: LifecycleRequest) {}

  transform(value: unknown): unknown {
    pushLifecycle(this.request, "04 Pipes");
    return value;
  }
}
