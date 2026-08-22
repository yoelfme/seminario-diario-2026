import type { Request } from "express";

export const LIFECYCLE_STEPS = [
  "01 Middleware",
  "02 Guards",
  "03 Interceptors",
  "04 Pipes",
  "05 Controlador",
  "06 Servicio",
] as const;

export type LifecycleStep = (typeof LIFECYCLE_STEPS)[number];

export type LifecycleRequest = Request & {
  requestId: string;
  lifecycle: LifecycleStep[];
};

export function pushLifecycle(req: LifecycleRequest, step: LifecycleStep): void {
  if (!req.lifecycle) {
    req.lifecycle = [];
  }
  if (!req.lifecycle.includes(step)) {
    req.lifecycle.push(step);
  }
  console.log(`[${req.requestId}] ${step}`);
}
