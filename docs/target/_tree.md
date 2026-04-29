---
project: calendar-tmpclaw
status: planned
created: 2026-04-29
---

# Calendar App — Target Architecture

> Team/family shared calendar deployed at calendar.tmpclaw.io with project shell at shell.calendar.tmpclaw.io.

## Areas

| Area | Description | Priority |
|------|-------------|----------|
| backend | Node.js API server — REST endpoints, auth, business logic | P0 |
| data (in backend) | PostgreSQL schema, migrations, seeding, connection management | P0 |
| frontend | Vanilla JS SPA — month grid, event modal, calendar sidebar | P0 |
| infrastructure | Helm charts, Dockerfile, IngressRoute, TLS | P0 |

## Components

| Component | Area | File | Priority |
|-----------|------|------|----------|
| api-server | backend | backend/api-server.md | P0 |
| database | backend | backend/database.md | P0 |
| spa | frontend | frontend/spa.md | P0 |
| calendar-chart | infrastructure | infrastructure/calendar-chart.md | P0 |
| shell-chart | infrastructure | infrastructure/shell-chart.md | P1 |
| dockerfile | infrastructure | infrastructure/dockerfile.md | P0 |

## Dependency Order

1. **database** — schema must exist before API can function
2. **api-server** — depends on database layer; provides REST for frontend
3. **spa** — depends on api-server endpoints being stable
4. **dockerfile** — depends on source code being complete
5. **calendar-chart** — depends on working container image
6. **shell-chart** — independent; uses existing project-shell image

## Key Architectural Decisions

- **Framework**: Existing code uses Fastify (not native HTTP as PRD suggests). Fastify provides typed routing, body parsing, and static file serving. Recommend keeping Fastify — the PRD intent was "no Express," and Fastify is a strictly better choice than raw `http.createServer` for maintainability.
- **Database**: Shared PostgreSQL at `postgres.tmpclaw.svc.cluster.local:5432/taskmaster`. Tables prefixed `cal_` to avoid conflicts.
- **Auth**: Traefik forward-auth middleware. Backend reads `X-Forwarded-User` header. No JWT validation.
- **Calendars**: Backend-backed (PostgreSQL), NOT localStorage. Current frontend stores calendars in localStorage — this must be migrated to API-backed.
