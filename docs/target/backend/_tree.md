---
area: backend
status: planned
created: 2026-04-29
---

# Backend Area

> Node.js API server with PostgreSQL persistence, forward-auth identity, and structured logging.

## Components

| Component | File | Priority | Description |
|-----------|------|----------|-------------|
| api-server | api-server.md | P0 | REST API routes, middleware, static file serving |
| database | database.md | P0 | Schema, migrations, connection pool, seeding |

## Current State

The backend exists (`src/index.ts`, `src/db.ts`) using Fastify with events-only CRUD. Major gaps:
- No `cal_calendars` table or API
- Events table uses wrong names (`events` not `cal_events`, `start_time` not `start_at`)
- No `calendar_id` foreign key or `all_day` field on events
- DB connection via PG* env vars instead of `DATABASE_URL`
- No connection retry logic
- No `/api/me` endpoint
- No `/api/calendars` endpoints
- `created_by` comes from request body, not `X-Forwarded-User` header
- `/healthz` doesn't return version
