import { EventLog } from "./event-log.js";

/**
 * La importación de 5000 filas de la charla. Es el caso servidor → cliente:
 * el dato cambia en el servidor, no con un clic del usuario.
 */

export const TOTAL_ROWS = 5000;
const ROWS_PER_TICK = 100;

// 50 ticks. Con 250 ms el job dura ~12.5 s: suficiente para que un polling de
// 3 s se vea claramente retrasado y para cortar la red a la mitad del stream.
const TICK_MS = Number(process.env.JOB_TICK_MS ?? 250);

export type JobStage = "queue" | "parse" | "insert" | "done";

export type JobEvent = {
  jobId: string;
  stage: JobStage;
  rows: number;
  total: number;
  pct: number;
  /** Cuándo lo generó el servidor. Con esto el cliente mide el retraso real. */
  at: number;
};

type Job = {
  id: string;
  startedAt: number;
  finishedAt: number | null;
  snapshot: JobEvent;
  log: EventLog<JobEvent>;
};

const jobs = new Map<string, Job>();

/** Los jobs terminados siguen en memoria un rato para que una reconexión pueda reenviarlos. */
const RETAIN_FINISHED_MS = 5 * 60 * 1000;

function stageFor(rows: number): JobStage {
  if (rows === 0) return "queue";
  if (rows >= TOTAL_ROWS) return "done";
  return rows < TOTAL_ROWS / 2 ? "parse" : "insert";
}

export function startJob(): Job {
  const id = crypto.randomUUID().slice(0, 8);
  const log = new EventLog<JobEvent>();
  const job: Job = {
    id,
    startedAt: Date.now(),
    finishedAt: null,
    snapshot: {
      jobId: id,
      stage: "queue",
      rows: 0,
      total: TOTAL_ROWS,
      pct: 0,
      at: Date.now(),
    },
    log,
  };
  jobs.set(id, job);
  log.append(job.snapshot);

  let rows = 0;
  const timer = setInterval(() => {
    rows = Math.min(rows + ROWS_PER_TICK, TOTAL_ROWS);
    const event: JobEvent = {
      jobId: id,
      stage: stageFor(rows),
      rows,
      total: TOTAL_ROWS,
      pct: Math.round((rows / TOTAL_ROWS) * 100),
      at: Date.now(),
    };
    job.snapshot = event;
    log.append(event);

    if (rows >= TOTAL_ROWS) {
      clearInterval(timer);
      job.finishedAt = Date.now();
      setTimeout(() => jobs.delete(id), RETAIN_FINISHED_MS).unref();
    }
  }, TICK_MS);

  return job;
}

export function getJob(id: string): Job | undefined {
  return jobs.get(id);
}

/** El job más reciente, para que una pestaña recién abierta tenga algo que mostrar. */
export function latestJob(): Job | undefined {
  let newest: Job | undefined;
  for (const job of jobs.values()) {
    if (!newest || job.startedAt > newest.startedAt) newest = job;
  }
  return newest;
}

export function jobCount(): number {
  return jobs.size;
}

export { TICK_MS as JOB_TICK_MS };
