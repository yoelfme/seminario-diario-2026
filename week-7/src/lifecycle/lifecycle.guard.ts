import {
  ForbiddenException,
  Injectable,
  type CanActivate,
  type ExecutionContext,
} from "@nestjs/common";

import {
  type LifecycleRequest,
  pushLifecycle,
} from "./lifecycle.ts";

@Injectable()
export class LifecycleGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const req = context.switchToHttp().getRequest<LifecycleRequest>();
    pushLifecycle(req, "02 Guards");

    if (req.headers["x-demo-token"] === "deny") {
      throw new ForbiddenException(
        "Guard blocked the request (x-demo-token: deny)",
      );
    }

    return true;
  }
}
