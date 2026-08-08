# Neural Horizons 2026 — Validation Demo

A Turborepo monorepo demonstrating why **frontend validation is for usability** and **API validation is for security**.

## What's inside

| App | Stack | Port |
| --- | --- | --- |
| `apps/api` | Hono + SQLite (better-sqlite3) | 3001 |
| `apps/webapp` | Next.js 16, TanStack Form, TanStack Query | 3000 |

## Getting started

```bash
pnpm install
pnpm dev
```

- Webapp: http://localhost:3000
- API: http://localhost:3001

## Three views

1. **Conference** (`/`) — conference details fetched via TanStack Query
2. **Register** (`/register`) — registration form with TanStack Form field validators
3. **Attendees** (`/attendees`) — list of all registrations from the API

## The teaching demo

### Step 1: Frontend validation (usability)

Open http://localhost:3000/register and try submitting with:

- Empty fields
- Invalid email (`notanemail`)
- Invalid phone (`abc`)
- Unchecked code of conduct

The form blocks submission and shows inline errors. This is **good UX** — users get instant feedback without a round-trip to the server.

### Step 2: Bypass with curl (the security gap)

Frontend validation only runs in the browser. Any client can POST directly to the API and skip the form entirely:

```bash
curl -X POST http://localhost:3001/registrations \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $(uuidgen)" \
  -d '{
    "fullName": "<script>alert(1)</script>",
    "email": "not-an-email",
    "phone": "xxx",
    "organization": "",
    "ticketType": "hacker",
    "yearsExperience": -999
  }'
```

Without API validation, this garbage would be stored and appear on http://localhost:3000/attendees. The UI cannot protect the trust boundary — only the server can.

> The `Idempotency-Key` header is required by the API — see the [idempotency demo](#idempotency-demo-correctness) below.

### Step 3: API validation with Zod (security)

The API now validates every `POST /registrations` request with a Zod schema via `@hono/zod-validator`. Re-run the same `curl` from Step 2:

```bash
curl -i -X POST http://localhost:3001/registrations \
  -H "Content-Type: application/json" \
  -d '{
    "fullName": "<script>alert(1)</script>",
    "email": "not-an-email",
    "phone": "xxx",
    "organization": "",
    "ticketType": "hacker",
    "yearsExperience": -999
  }'
```

The API returns **400** with Zod validation issues — no row is inserted. Visit http://localhost:3000/attendees and confirm the garbage data does not appear.

### Conclusion

| Layer | Validates? | Purpose |
| --- | --- | --- |
| Frontend (TanStack Form) | Yes | Usability — instant feedback, fewer bad submits |
| API (Hono + Zod) | Yes | Security — enforces the trust boundary; clients can be bypassed |

**Always validate on both sides.** Frontend validation improves UX; API validation enforces the trust boundary because clients can be bypassed.

## Pagination demo (performance)

The attendees page fetches registrations from `GET /registrations` with server-side pagination (default **50** per page). Seed a large dataset to compare the old “load everything” cost with paginated loading:

```bash
pnpm --filter @app/api seed          # 50,000 attendees (default)
pnpm --filter @app/api seed -- 10000 # custom count
```

Then open http://localhost:3000/attendees — only one page loads at a time, with TanStack Table controls for next/previous pages and page size.

## Idempotency demo (correctness)

Validation stops *bad* data. It does nothing about the *same good* data arriving
twice. A user double-clicks, a phone drops off 4G mid-request and the browser
retries, a proxy replays a timed-out POST — one intent, several requests, several
attendees.

`POST /registrations` is deliberately slowed by ~2s (`REGISTRATION_DELAY_MS`) so
the in-flight window is wide enough to click through.

### Step 1: The problem — run the API without idempotency

```bash
pnpm --filter @app/api dev:no-idempotency
```

The startup banner confirms the mode:

```
API running at http://localhost:3001
  idempotency: OFF (duplicates allowed)
  POST /registrations delay: 2000ms
```

Fire the same registration five times at once:

```bash
for i in 1 2 3 4 5; do
  curl -s -X POST http://localhost:3001/registrations \
    -H "Content-Type: application/json" \
    -d '{
      "fullName": "Ana Lopez",
      "email": "ana.lopez@acme.io",
      "phone": "+502 5555 1234",
      "organization": "Acme",
      "ticketType": "professional",
      "yearsExperience": 5
    }' &
done; wait
```

Five `201`s with five different `id`s. Confirm on http://localhost:3000/attendees —
five Ana Lopez rows, one human. Every request was individually valid; Zod had
nothing to reject.

The same thing in the browser: open http://localhost:3000/register, fill the
form, tick **Allow double submit** in the *Demo controls* panel, and click
"Complete registration" three times. The disabled-while-pending button was the
only thing preventing this, and it is a client-side courtesy — `curl`, a retrying
browser, or a flaky proxy never sees it.

### Step 2: The fix — an idempotency key

Restart the API normally:

```bash
pnpm --filter @app/api dev
```

The client now generates a UUID per *logical registration* and sends it as
`Idempotency-Key`. The API records each key in an `idempotency_keys` table and
guarantees the handler runs at most once per key. The header is **required** —
a `POST` without one is a `400`.

Repeat the five concurrent requests, this time with a shared key:

```bash
KEY=$(uuidgen)
for i in 1 2 3 4 5; do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:3001/registrations \
    -H "Content-Type: application/json" \
    -H "Idempotency-Key: $KEY" \
    -d '{
      "fullName": "Bruno Diaz",
      "email": "bruno.diaz@acme.io",
      "phone": "+502 5555 9999",
      "organization": "Acme",
      "ticketType": "student",
      "yearsExperience": 2
    }' &
done; wait
```

One `201` and four `409`s — and exactly **one** row. The first request wins the
`INSERT` into `idempotency_keys`; the composite primary key `(endpoint, key)` is
the lock that rejects the rest.

Retry after the original finished and you get the **cached response** rather than
a new row — same `id`, plus an `Idempotency-Replayed: true` header:

```bash
curl -i -X POST http://localhost:3001/registrations \
  -H "Content-Type: application/json" \
  -H "Idempotency-Key: $KEY" \
  -d '{ ...the same payload... }'
```

### The four outcomes

| Situation | Response |
| --- | --- |
| New key | `201` — handler runs, response cached, `Idempotency-Replayed: false` |
| Same key, same payload, original still running | `409` — retry once it finishes |
| Same key, same payload, original finished | `201` replayed from cache, `Idempotency-Replayed: true` |
| Same key, **different** payload | `422` — a key identifies one specific request |
| No key at all | `400` |

`409` and `422` follow [draft-ietf-httpapi-idempotency-key-header](https://datatracker.ietf.org/doc/draft-ietf-httpapi-idempotency-key-header/).

Payloads are compared by a SHA-256 **fingerprint** of canonical JSON (object keys
sorted), so reordering fields does not look like a different request. An invalid
payload never burns a key — the middleware is mounted *after* the Zod validator,
so a `400` leaves the key free to reuse.

Inspect the bookkeeping directly:

```bash
sqlite3 apps/api/data/registrations.db \
  'SELECT key, status, response_status FROM idempotency_keys;'
```

### The key names an operation, not a request

The most common way to get this wrong is to generate a fresh key on every HTTP
request. Then the server sees each retry as a brand-new registration and the
duplicates come straight back. Tick **New key on every request** in the *Demo
controls* panel alongside **Allow double submit** and click three times — three
rows, exactly as in Step 1, with idempotency fully enabled.

The panel shows the current key and has a **Start a new registration (rotate
key)** button. Rotating is what makes the *next* registration a genuinely new
operation; reusing is what makes a *retry* a retry.

### Conclusion

| Layer | Protects against | Purpose |
| --- | --- | --- |
| Disabled submit button | An impatient user, in this browser tab | Usability |
| `Idempotency-Key` + server-side key table | Double-clicks, retries, replays, any client | Correctness |

**A disabled button is a hint. Idempotency is a guarantee.** The client cannot
enforce "exactly once" any more than it can enforce validation — both belong on
the server.

## Commands

```bash
pnpm dev              # run api + webapp
pnpm build            # build all
pnpm check-types      # type-check all

pnpm --filter @app/api seed
pnpm --filter @app/api dev
pnpm --filter @app/api dev:no-idempotency   # Step 1 of the idempotency demo
pnpm --filter @app/webapp dev
```

### API environment variables

| Variable | Default | Effect |
| --- | --- | --- |
| `REGISTRATION_DELAY_MS` | `2000` | Artificial delay on `POST /registrations`. Set `0` to disable. |
| `IDEMPOTENCY` | *(on)* | Set to `off` to disable idempotency entirely — the "before" state. |
