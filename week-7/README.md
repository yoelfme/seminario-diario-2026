# Seminario 2026 — Week 7

NestJS request lifecycle + PostgreSQL 18 + Prisma 8 (contracts & migrations).

A small classroom demo: one resource (`Talk`), six numbered lifecycle steps that match the slide, and a live migration loop you can run in front of the class.

## What we built

| Concern | What is in the repo |
| --- | --- |
| HTTP lifecycle | Global middleware, guard, interceptor, and pipe that record `01`…`06` on every request |
| Nest trio | `TalksModule` → `TalksController` → `TalksService` (+ `PrismaService`) |
| Persistence | Postgres 18 in Docker, Prisma 8 contract, typed queries on `db.orm.public.Talk` |
| Migrations | Planned TypeScript packages under `migrations/app/`, apply / status / reset / seed scripts |
| Teaching UI | `GET /` HTML timeline that highlights the steps returned by `GET /talks` |

```mermaid
flowchart TB
  Client[HTTP client or browser] --> Nest[NestJS API]
  Nest --> Lifecycle[Lifecycle pipeline]
  Lifecycle --> Talks[TalksModule]
  Talks --> PrismaSvc[PrismaService]
  PrismaSvc --> Orm[Prisma 8 ORM]
  Orm --> Pg[(PostgreSQL 18)]
  Compose[compose.yaml] -.-> Pg
  Contract[contract.prisma] --> Emit[contract emit]
  Emit --> Plan[migration plan]
  Plan --> Migrate[migrate]
  Migrate --> Pg
```

## Stack

| Piece | Choice |
| --- | --- |
| NestJS | 11.x |
| Prisma | 8 RC (`prisma`, `@prisma/orm-postgres`) |
| Postgres | `postgres:18` via [`compose.yaml`](compose.yaml) (host port **5433**) |
| Package manager | pnpm |
| Node | `>=24` |

## Project layout

```
week-7/
├── compose.yaml                 # Postgres 18
├── prisma.config.ts             # Prisma 8 CLI config
├── migrations/app/              # Planned migrations (migration.ts + ops.json)
├── scripts/
│   ├── seed.ts                  # Sample talks
│   └── db-reset.ts              # Wipe volume → migrate → seed
└── src/
    ├── main.ts
    ├── app.module.ts            # Wires global guard/interceptor + middleware
    ├── app.controller.ts        # GET / HTML timeline
    ├── lifecycle/               # 01–04 pipeline pieces
    ├── talks/                   # Module / Controller / Service / DTO
    ├── prisma.service.ts
    └── prisma/
        ├── contract.prisma      # Authored schema (Talk)
        ├── contract.json        # Emitted contract (do not edit)
        ├── db.ts                # Prisma 8 client
        ├── talks.ts             # listTalks / createTalk
        └── seed.ts
```

```mermaid
flowchart LR
  subgraph nestApp [Nest application]
    AppMod[AppModule]
    TalksMod[TalksModule]
    AppMod --> TalksMod
    AppMod --> MW[LifecycleMiddleware]
    AppMod --> Guard[LifecycleGuard]
    AppMod --> Ix[LifecycleInterceptor]
    TalksMod --> Ctrl[TalksController]
    TalksMod --> Svc[TalksService]
    TalksMod --> Prisma[PrismaService]
    Ctrl --> Pipe[LifecyclePipe plus validation]
    Ctrl --> Svc
    Svc --> Prisma
  end
```

## API

| Method | Path | Purpose |
| --- | --- | --- |
| `GET` | `/` | HTML timeline of the six lifecycle steps |
| `GET` | `/talks` | List talks; response includes `lifecycle` |
| `POST` | `/talks` | Create a talk `{ "title", "speaker" }` |

Example response:

```json
{
  "lifecycle": [
    "01 Middleware",
    "02 Guards",
    "03 Interceptors",
    "04 Pipes",
    "05 Controlador",
    "06 Servicio"
  ],
  "data": [
    {
      "id": 1,
      "title": "NestJS request lifecycle",
      "speaker": "Ana López",
      "createdAt": "2026-08-22T01:06:16.108Z"
    }
  ]
}
```

## Getting started

```bash
# 1. Start Postgres 18
docker compose up -d

# 2. Env
cp .env.example .env
export DATABASE_URL="postgresql://seminario:seminario@localhost:5433/seminario"

# 3. Install + apply migrations + seed
pnpm install
pnpm migrate
pnpm db:seed

# 4. Run the API
pnpm dev
```

- App: http://localhost:3000
- Talks: http://localhost:3000/talks

> Host port **5433** avoids clashing with other local Postgres on 5432. The container still listens on 5432 internally.

---

## 1. HTTP request lifecycle

Same order as the classroom slide: middleware → guards → interceptors → pipes → controller → service. Interceptors also run **after** the handler on the way out.

```mermaid
flowchart LR
  Req[HTTP request] --> MW[01 Middleware]
  MW --> G[02 Guards]
  G --> IBefore[03 Interceptors before]
  IBefore --> P[04 Pipes]
  P --> C[05 Controlador]
  C --> S[06 Servicio]
  S --> Prisma[(PostgreSQL)]
  Prisma --> S
  S --> C
  C --> IAfter[03 Interceptors after]
  IAfter --> Res[JSON plus lifecycle]
```

| Step | Code | Role in the demo |
| --- | --- | --- |
| 01 Middleware | [`lifecycle.middleware.ts`](src/lifecycle/lifecycle.middleware.ts) | Assigns `requestId`, starts the trace |
| 02 Guards | [`lifecycle.guard.ts`](src/lifecycle/lifecycle.guard.ts) | Allows by default; `x-demo-token: deny` → 403 |
| 03 Interceptors | [`lifecycle.interceptor.ts`](src/lifecycle/lifecycle.interceptor.ts) | Logs before/after; wraps JSON with `lifecycle` |
| 04 Pipes | [`lifecycle.pipe.ts`](src/lifecycle/lifecycle.pipe.ts) + validation | Marks pipes; validates `CreateTalkDto` on POST |
| 05 Controlador | [`talks.controller.ts`](src/talks/talks.controller.ts) | Thin HTTP mapping |
| 06 Servicio | [`talks.service.ts`](src/talks/talks.service.ts) | Calls Prisma only |

Terminal output for one request:

```text
[a1b2c3d4] 01 Middleware
[a1b2c3d4] 02 Guards
[a1b2c3d4] 03 Interceptors
[a1b2c3d4] 04 Pipes
[a1b2c3d4] 05 Controlador
[a1b2c3d4] 06 Servicio
[a1b2c3d4] 03 Interceptors (after) 12ms
```

### Try it

```bash
# Full pipeline
curl -s http://localhost:3000/talks | jq

# Guard blocks the request
curl -i -H 'x-demo-token: deny' http://localhost:3000/talks

# Pipe rejects bad input (400)
curl -i -X POST http://localhost:3000/talks \
  -H 'Content-Type: application/json' \
  -d '{"title":"x"}'

# Create a talk
curl -s -X POST http://localhost:3000/talks \
  -H 'Content-Type: application/json' \
  -d '{"title":"Live demo talk","speaker":"Yoel"}' | jq
```

Or open http://localhost:3000 and click **GET /talks** — the page highlights each step from the response.

---

## 2. Persistence: Postgres, contract, Prisma 8 Migrate

```mermaid
flowchart TB
  subgraph layers [Persistence mental model]
    Pg[(PostgreSQL)]
    Contract[Contract plus ORM]
    Migrate[Prisma 8 Migrate]
  end

  Author[Edit contract.prisma] --> Emit[pnpm contract:emit]
  Emit --> Artifacts[contract.json and contract.d.ts]
  Artifacts --> Plan[pnpm migration:plan]
  Plan --> Package[migrations/app/timestamp_name]
  Package --> Apply[pnpm migrate]
  Apply --> Pg
  App[TalksService] --> Client[db.orm.public.Talk]
  Client --> Pg
```

| Layer | Role |
| --- | --- |
| **PostgreSQL** | Source of truth: types, constraints, relations. What the schema does not prevent, the code must prevent. |
| **Contract + ORM** | `contract.prisma` compiles to a contract; queries are typed (`db.orm.public.Talk`). Autocomplete helps — you still read the SQL. |
| **Prisma 8 Migrate** | Compares the emitted contract to history, plans a versioned package, applies it safely. |

Queries look like this (Prisma 8 — no `{ data: ... }` wrapper):

```ts
await db.orm.public.Talk.create({ title, speaker });
await db.orm.public.Talk.select("id", "title", "speaker", "createdAt").all();
```

### Migration cycle (Prisma 8 vs the slide)

Classroom slides often show Prisma 7 commands. This project uses **Prisma 8**:

| Idea on the slide | Command in this repo |
| --- | --- |
| Generate from schema and apply (dev) | `pnpm contract:emit` → `pnpm migration:plan --name <name>` → `pnpm migrate` |
| Apply pending history (CI / prod) | `pnpm migrate` (no separate `deploy`) |
| Status / ordered history | `pnpm migration:status` · `pnpm migration:log` · `pnpm migration:list` |
| Reset (dev only) | `pnpm db:reset` (Compose volume wipe + migrate + seed) |
| Seed | `pnpm db:seed` |

```mermaid
sequenceDiagram
  participant Dev as Developer
  participant Contract as contract.prisma
  participant CLI as Prisma 8 CLI
  participant Disk as migrations/app
  participant DB as PostgreSQL

  Dev->>Contract: Add field e.g. room String?
  Dev->>CLI: pnpm contract:emit
  CLI->>Contract: Compile to contract.json
  Dev->>CLI: pnpm migration:plan --name add-room
  CLI->>Disk: Write migration.ts and ops.json
  Dev->>CLI: pnpm migrate
  CLI->>DB: Apply pending ops
  Dev->>CLI: pnpm migration:status
  CLI->>DB: Compare marker to target
```

### Live schema change (in class)

1. Edit [`src/prisma/contract.prisma`](src/prisma/contract.prisma) — add e.g. `room String?` to `Talk`
2. Emit, plan, apply:

   ```bash
   export DATABASE_URL="postgresql://seminario:seminario@localhost:5433/seminario"
   pnpm contract:emit
   pnpm migration:plan --name add-room
   pnpm migrate
   ```

3. Open the new folder under `migrations/app/` — `migration.ts` is what you edit; `ops.json` is what Prisma runs.
4. Show history:

   ```bash
   pnpm migration:status
   pnpm migration:list
   ```

5. Full wipe + replay + seed:

   ```bash
   pnpm db:reset
   curl -s http://localhost:3000/talks | jq
   ```

After adding a column, update [`src/prisma/talks.ts`](src/prisma/talks.ts) / the DTO if the API should expose it.

```mermaid
flowchart LR
  Reset[pnpm db:reset] --> Down[compose down -v]
  Down --> Up[compose up -d]
  Up --> Wait[Wait until healthy]
  Wait --> Mig[pnpm migrate]
  Mig --> Seed[pnpm db:seed]
  Seed --> Ready[Sample talks again]
```

---

## Commands

```bash
pnpm dev                 # Nest API with reload
pnpm build && pnpm start # production bundle

pnpm contract:emit       # compile contract.prisma → contract.json
pnpm migration:plan --name <slug>
pnpm migrate             # apply pending migrations
pnpm migration:status
pnpm migration:log
pnpm migration:list

pnpm db:seed             # sample talks
pnpm db:reset            # wipe volume, migrate, seed
pnpm db:init             # first-time additive bootstrap (optional; prefer migrate)
pnpm db:verify           # verify DB against emitted contract
```

## Notes

- Prisma 8 is a **Release Candidate**. APIs can still move; this demo pins the Nest scaffold + `@prisma/orm-postgres` stack.
- Prefer exporting `DATABASE_URL` in the shell; `pnpm dev` also loads `.env` via `tsx --env-file=.env`.
- Prisma Compute / Prisma Postgres cloud deploy is **out of scope** — the classroom DB is local Compose.
