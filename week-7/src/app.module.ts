import { Module, RequestMethod, type MiddlewareConsumer, type NestModule } from "@nestjs/common";
import { APP_GUARD, APP_INTERCEPTOR } from "@nestjs/core";

import { AppController } from "./app.controller.ts";
import { LifecycleGuard } from "./lifecycle/lifecycle.guard.ts";
import { LifecycleInterceptor } from "./lifecycle/lifecycle.interceptor.ts";
import { LifecycleMiddleware } from "./lifecycle/lifecycle.middleware.ts";
import { TalksModule } from "./talks/talks.module.ts";

@Module({
  imports: [TalksModule],
  controllers: [AppController],
  providers: [
    { provide: APP_GUARD, useClass: LifecycleGuard },
    { provide: APP_INTERCEPTOR, useClass: LifecycleInterceptor },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer
      .apply(LifecycleMiddleware)
      .forRoutes({ path: "*", method: RequestMethod.ALL });
  }
}
