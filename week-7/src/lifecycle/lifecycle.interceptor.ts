import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from "@nestjs/common";
import { map, tap, type Observable } from "rxjs";

import {
  type LifecycleRequest,
  pushLifecycle,
} from "./lifecycle.ts";

@Injectable()
export class LifecycleInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<LifecycleRequest>();
    pushLifecycle(req, "03 Interceptors");
    const startedAt = Date.now();

    return next.handle().pipe(
      tap(() => {
        console.log(
          `[${req.requestId}] 03 Interceptors (after) ${Date.now() - startedAt}ms`,
        );
      }),
      map((data) => {
        if (typeof data === "string") {
          return data;
        }

        if (
          data !== null &&
          typeof data === "object" &&
          !Array.isArray(data) &&
          "lifecycle" in data
        ) {
          return data;
        }

        return {
          lifecycle: req.lifecycle ?? [],
          data,
        };
      }),
    );
  }
}
