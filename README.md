# Runy — The Universal Sync Provider

A small NestJS project showing how I'd architect the relationship between our
**internal domains** (Listings, Communications) and **external platforms**
(Airbnb, Gmail, Slack).

> No real API calls — each provider `console.log`s the action it *would* take,
> as specified. The interesting part is the wiring, not the HTTP.

---

## The problem in one line

Every internal domain may need to sync with several external platforms, and
every platform cares about a different slice of our data. Wire that up naively
and you get an **N × M mesh**: each new domain or platform multiplies the
integration code, and domains end up importing `AirbnbClient`, `GmailClient`, …

```
        ┌ Airbnb        Listings ─┬─ Airbnb
Listings┼ Gmail    vs.            └─ Slack
        └ Slack       Messages ──┬─ Gmail
Messages┼ …                      └─ Slack
        └ …          (each arrow = bespoke, coupled code)
```

## The approach: collapse N × M into N + M

Four moving parts, each with one job. The dependency arrow only ever points
**domains → sync platform → provider interface** — never back.

```
 Listings ─┐                                    ┌─► AirbnbProvider
           │  publish(canonical)                │
           ├──────────────►  SyncPublisher      ├─► GmailProvider
           │                      │             │
 Messages ─┘                      ▼             └─► SlackProvider
                            (event bus)               ▲
                                  │                   │ routes by
                                  ▼                   │ capabilities
                          SyncOrchestrator ───────────┘
                                  │  asks
                                  ▼
                          SyncProviderRegistry  (auto-discovers providers)
```

1. **Canonical model** (`sync/core/canonical-resource.ts`) — an
   anti-corruption layer. Domains map their rich internal entities into a small,
   stable `CanonicalResource`. Providers depend on *this*, never on a domain.

2. **Domain events** — a domain that changes data calls `SyncPublisher.publish()`
   and moves on. It doesn't know who's listening, or that Airbnb exists.

3. **`SyncProvider` strategy + declared capabilities** — each external platform
   is one class that states, *in data*, which resource types and operations it
   handles. No `if (platform === …)` anywhere.

4. **Orchestrator + registry** — the registry auto-discovers every provider at
   startup; the orchestrator routes each event to only the capable providers,
   with **fault isolation** (one platform failing never blocks the rest).

### What this buys us

| I want to…                    | I change…                                            |
| ----------------------------- | ---------------------------------------------------- |
| Add a platform (e.g. Booking) | **one new file** + one line in `SyncModule`          |
| Add a domain (e.g. Payments)  | a service that maps to canonical & calls `publish()` |
| Change a platform's scope     | edit its `capabilities` object                       |
| Refactor an internal entity   | its `toCanonical()` mapper — nothing downstream      |

Nobody edits the orchestrator, registry, or any other domain/provider to do the
above. That's the payoff.

---

## Capability matrix (the live routing table)

Derived automatically from each provider's `capabilities` — see it at
`GET /sync/capabilities`.

| Platform | Listing              | Message | Role                       |
| -------- | -------------------- | ------- | -------------------------- |
| Airbnb   | create/update/delete | —       | property distribution      |
| Gmail    | —                    | create  | outbound email             |
| Slack    | create (notify)      | create  | internal ops notifications |

Note the asymmetries this cleanly expresses:
- A **new listing** fans out to *Airbnb + Slack*; an **update** goes to *Airbnb only*.
- A **message** fans out to *Gmail + Slack*.
- **Slack spans both domains** — proof the model is genuinely many-to-many.

---

## Run it

```bash
npm install
npm run start        # or: npm run start:dev  (hot-reload)
```

On boot, `DemoService` runs four scenarios so you see the full fan-out in the
console immediately (this seeds `listing_1`). Then hit the REST API yourself.

> **Two terminals.** The curl response only shows the created entity (JSON).
> The interesting part — the `console.log` sync fan-out — prints in the
> **server terminal** where `npm run start` is running. Keep an eye on that tab.

---

## API & curl examples

Base URL: `http://localhost:3000`. Every example below shows the request and the
lines it triggers in the **server terminal**.

### Listings

**Create a listing** → fans out to Airbnb + Slack

```bash
curl -s localhost:3000/listings -H 'content-type: application/json' -d '{
  "name":"Sea View Studio","summary":"Cozy studio by the beach",
  "nightlyRate":90,"currency":"€","street":"Av. Marginal 1",
  "city":"Cascais","country":"Portugal","sleeps":2 }'
```
```
[SyncOrchestrator] Fanning out create on listing (listing_2) → Airbnb, Slack
[AirbnbProvider]   [API →] Creating Airbnb listing "Sea View Studio" @ €90/night, sleeps 2 (internal id listing_2)
[SlackProvider]    [API →] Posting to #listings: 🏠 new listing "Sea View Studio" is live (€90/night)
```

**Update a listing** → Airbnb only (Slack only declared `create`)

```bash
curl -s -X PATCH localhost:3000/listings/listing_2 \
  -H 'content-type: application/json' -d '{ "nightlyRate":110 }'
```
```
[SyncOrchestrator] Fanning out update on listing (listing_2) → Airbnb
[AirbnbProvider]   [API →] Updating Airbnb listing "Sea View Studio" (internal id listing_2)
```

**Delete a listing** → Airbnb de-lists (returns `204 No Content`)

```bash
curl -s -i -X DELETE localhost:3000/listings/listing_2
```
```
[SyncOrchestrator] Fanning out delete on listing (listing_2) → Airbnb
[AirbnbProvider]   [API →] De-listing Airbnb listing (internal id listing_2)
```

**List all listings** (no sync — read only)

```bash
curl -s localhost:3000/listings
```

### Messages

**Send a message** → fans out to Gmail + Slack

```bash
curl -s localhost:3000/messages -H 'content-type: application/json' -d '{
  "medium":"email","senderName":"Host","recipient":"guest@x.com",
  "subject":"Welcome","content":"See you soon","conversationId":"c1" }'
```
```
[SyncOrchestrator] Fanning out create on message (msg_2) → Gmail, Slack
[GmailProvider]    [API →] Sending email to guest@x.com — "Welcome": See you soon
[SlackProvider]    [API →] Posting to #comms: new message from Host — "See you soon"
```

**List all messages**

```bash
curl -s localhost:3000/messages
```

### Diagnostics

**Live routing matrix** — the capability table, derived from each provider's
declared capabilities (no manual upkeep):

```bash
curl -s localhost:3000/sync/capabilities
```
```json
[
  { "provider": "Airbnb", "capabilities": { "listing": ["create","update","delete"] } },
  { "provider": "Gmail",  "capabilities": { "message": ["create"] } },
  { "provider": "Slack",  "capabilities": { "message": ["create"], "listing": ["create"] } }
]
```

### Tests

```bash
npm test   # routing + fault-isolation unit tests
```

> **Note on IDs:** the boot demo creates `listing_1`, so your first `POST
> /listings` becomes `listing_2`. Use `GET /listings` to grab a real id before
> `PATCH`/`DELETE`, or adjust the id in the examples above to match your run.

---

## Project layout

```
src/
├─ sync/                          the sync platform (generic, reusable)
│  ├─ core/
│  │  ├─ canonical-resource.ts      canonical model (anti-corruption layer)
│  │  ├─ sync-event.ts              the one event domains publish
│  │  ├─ sync-provider.interface.ts SyncProvider strategy + capabilities
│  │  ├─ sync-provider.decorator.ts @RegisterSyncProvider() marker
│  │  └─ abstract-sync-provider.ts  create/update/delete template
│  ├─ providers/                   one file per external platform
│  │  ├─ airbnb.provider.ts
│  │  ├─ gmail.provider.ts
│  │  └─ slack.provider.ts
│  ├─ sync-provider.registry.ts    auto-discovers providers, answers routing
│  ├─ sync.orchestrator.ts         listens, routes, isolates failures
│  ├─ sync.publisher.ts            the single door domains publish through
│  └─ sync.controller.ts           GET /sync/capabilities
└─ domains/                        internal business domains
   ├─ listings/                    entity · service (maps→canonical) · controller
   └─ communications/              same shape — the recipe every domain follows
```

---

## Deliberate scope cuts (and where they'd grow up)

Kept out to stay small, but the seams are already in place:

- **Delivery guarantees** — the in-process event bus is synchronous. Production
  would swap `SyncPublisher` for an outbox + queue (BullMQ/SQS). Domains and
  providers wouldn't change — only the transport behind `publish()`.
- **Retries / idempotency / rate limits** — these belong around
  `SyncOrchestrator.dispatch()`, which is deliberately a single choke point.
- **ID mapping** — a real provider keeps its own `internalId ↔ externalId` map;
  here the internal id rides along in the canonical envelope.
- **Persistence** — domains use in-memory `Map`s; a repository swap is isolated
  to each service.
- **Inbound sync** — this models outbound (us → platform). The mirror image
  (platform webhooks → us) would add an inbound port on each provider, routing
  back through the same canonical model.
