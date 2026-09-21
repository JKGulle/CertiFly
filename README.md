# CertiFly — automated certificate issuance

An event-driven pipeline: a source system reports that a user is eligible
(course completion, exam pass, webinar check-in), and a signed, verifiable
PDF certificate is generated and emailed with no human in the loop.

This implements the architecture in full, with every external system
(queue, object storage, email) stubbed to a local equivalent so the whole
thing runs with zero outside infra — swap in SQS/S3/SES later without
touching the pipeline logic.

## Pipeline

```
Source system --POST /api/events--> EligibilityEvent (queue table, "PENDING")
                                            |
                                    worker polls, dedupes
                                            |
                              POST /api/internal/issue-certificate
                                            |
                    template merge -> PDF + QR render -> sha256
                                            |
                     storage/certificates/*.pdf   Certificate row (DB)
                                            |
                                    email with signed link
                                            |
                          anyone with the QR -> GET /verify/:code
```

- **Idempotency**: unique constraint on `(eventId, recipientId)`. Replayed
  events are a no-op, not a duplicate certificate.
- **Retries**: failed events return to `PENDING` up to 5 attempts, then
  `DEAD_LETTER`. There's no admin UI for the queue itself — inspect/requeue
  `EligibilityEvent` rows directly (e.g. via `npm run db:studio`) if needed.
- **Revocation**: `Certificate.status` still supports `REVOKED`/`REISSUED` and
  `/verify` reports them correctly, but there's no admin action to create new
  ones anymore — update `status` directly (e.g. via `npm run db:studio`) if
  you need to.

## Run it

```bash
npm install
cp .env.example .env   # already done in this checkout; regenerate DOWNLOAD_TOKEN_SECRET for real use
npm run db:up          # starts the Postgres container (docker-compose.yml) in the background
npx prisma migrate dev # applies prisma/migrations against it
npm run db:seed        # seeds a default template and the one admin account
npm run dev:all        # runs the Next.js app + the queue worker together
```

`DATABASE_URL` in `.env.example` points at
`postgresql://certifly:certifly@localhost:5432/certifly`. Point it at any
other Postgres 14+ server instead and skip `npm run db:up` if you'd rather
not run Postgres locally at all.

`npm run db:up` / `npm run db:down` wrap `docker compose up -d db` /
`docker compose down` (see `docker-compose.yml`) — Docker Desktop needs to be
running first.

Then open:

- `/` — redirects to `/generate/dashboard` if logged in, `/login` otherwise
- `/login` — the one admin account, created by `npm run db:seed`
- `/generate/dashboard` — summary stats and recent activity; the landing page
  of the admin console once logged in
- `/generate` — create and publish a certificate directly; a persistent nav
  links to Dashboard, Reports, Templates, and Certificates. External systems
  (an LMS, exam grader, webinar platform) reach the same pipeline through
  `POST /api/events` instead
- `/certificates` — every certificate issued so far, with a signed download
  link (public, no login needed)
- `/verify/:code` — the public verification page (also what the certificate's
  QR code points at)

Run `npm run dev` and `npm run worker` in separate terminals instead of
`dev:all` if you want their logs apart.

No SMTP is required for local use — emails are written to
`storage/mail/*.eml` instead of being sent. Set `SMTP_HOST` (and friends) in
`.env` to send for real.

## Where things live

| Concern | File |
|---|---|
| Event ingress (the "event bus" producer side) | `src/app/api/events/route.ts` |
| Queue polling / retry / dead-letter | `src/worker/index.ts` |
| Actual issuance (template merge, PDF, QR, email) | `src/worker/processEvent.ts` |
| Certificate PDF layout | `src/lib/certificateDocument.tsx` |
| Signed, expiring download links | `src/lib/downloadToken.ts` |
| Public verification | `src/app/api/verify/[code]/route.ts` |
| Data model | `prisma/schema.prisma` |

## Known simplifications (documented, not accidental)

- **Queue**: a polled Postgres table instead of SQS/Kafka — swappable later,
  the worker's interface (claim a batch, ack, dead-letter) doesn't change.
  Assumes a single worker process; the poll loop doesn't use `SELECT ...
  FOR UPDATE SKIP LOCKED` (which Postgres does support) for safe concurrent
  consumers.
- **Rendering runs inside the Next.js server**, not the standalone worker
  process — `@react-pdf/renderer`'s package exports don't resolve under a
  plain Node/tsx process, only through Next's own bundler. The worker calls
  `/api/internal/issue-certificate` over HTTP to render; in a real deployment
  this split (thin consumer, separate render service) is normal anyway.
- **Object storage** is the local filesystem (`storage/certificates/`)
  behind the same signed-URL interface a real S3 client would expose.
- **No auth** — the dashboard and admin console are unauthenticated. A real
  deployment gates the dashboard by logged-in user and the admin console by
  RBAC, per the stack table below.
- **Email** defaults to writing `.eml` files locally instead of sending
  unless `SMTP_HOST` is set.

## Swapping in real infrastructure

| Layer | Demo | Production |
|---|---|---|
| Event bus | `EligibilityEvent` table + poll loop | SQS / Kafka / RabbitMQ |
| Storage | local filesystem | S3 / GCS + CDN |
| Email | `.eml` files on disk | SES / SendGrid / Postmark |
| Database | Postgres (local Docker container) | Managed Postgres (RDS / Neon / Cloud SQL) |
| Auth | none | OIDC (Auth0 / Cognito) |
