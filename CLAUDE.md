# Calendar App — calendar.tmpclaw.io

## Overview
Team/family shared calendar web application. All authenticated users have equal access — no role-based permissions. Recurring events, invitations, and notifications are out of scope for v1.

## Tech Stack
- **Runtime**: Node.js 22, TypeScript strict mode
- **Framework**: Fastify 4.x (body parsing, routing, static serving)
- **Database**: PostgreSQL 15+ at `postgres.tmpclaw.svc.cluster.local:5432/taskmaster`
- **Frontend**: Vanilla JS SPA (public/index.html, public/app.js, public/style.css)
- **Auth**: Traefik forward-auth middleware → X-Forwarded-User header
- **Logging**: pino (never console.log)
- **Container**: node:22-slim, UID 1000:1000
- **Registry**: localhost:31500/calendar-tmpclaw/calendar

## Directory Structure
```
/                       # repo root
├── CLAUDE.md           # this file
├── Dockerfile          # multi-stage build
├── package.json        # @tmpclaw/calendar
├── tsconfig.json       # strict mode, ES2022
├── src/
│   ├── index.ts        # Fastify server, routes
│   └── db.ts           # PostgreSQL pool, migrations, CRUD
├── public/
│   ├── index.html      # SPA shell
│   ├── app.js          # SPA logic
│   └── style.css       # warm palette styles
├── chart/              # Helm chart for calendar app
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
├── chart-shell/        # Helm chart for project shell
│   ├── Chart.yaml
│   ├── values.yaml
│   └── templates/
└── docs/               # target/implemented specs
```

## Build & Run
```bash
npm install             # install dependencies
npm run build           # tsc → dist/
npm start               # node dist/index.js
npm run dev             # ts-node src/index.ts (dev only)
```

## Database
- Connection: `DATABASE_URL=postgresql://tmpclaw:tmpclaw@postgres.tmpclaw.svc.cluster.local:5432/taskmaster`
- Tables: `cal_calendars`, `cal_events` (prefixed to avoid conflicts)
- Migrations: CREATE TABLE IF NOT EXISTS on startup
- Seeding: default "Family" calendar (color #8B5E3C) if cal_calendars empty

## API Endpoints
| Method | Path | Description |
|--------|------|-------------|
| GET | /healthz | Health check → {status, version} |
| GET | /api/me | Current user → {user} from X-Forwarded-User |
| GET | /api/calendars | List all calendars |
| POST | /api/calendars | Create calendar {name, color} |
| PUT | /api/calendars/:id | Update calendar |
| DELETE | /api/calendars/:id | Delete calendar (cascade events) |
| GET | /api/events?from=&to= | Events in date range |
| POST | /api/events | Create event |
| PUT | /api/events/:id | Update event |
| DELETE | /api/events/:id | Delete event |

## Code Conventions
- TypeScript strict mode, no `any` type suppressions
- Pino for all logging — never console.log
- Parameterized SQL queries — never string interpolation
- HTML escaping for all user-provided strings rendered in DOM
- data-testid attributes on all interactive elements (format: `calendar-{type}-{name}`)
- No external CSS frameworks

## Helm Deploy
```bash
# Calendar app
helm upgrade --install calendar chart/ -n tmpclaw --set image.tag=$(date +%s)

# Shell
helm upgrade --install calendar-shell chart-shell/ -n tmpclaw --set image.tag=<project-shell-tag>
```

## Key Design Decisions
1. **Fastify over native HTTP**: PRD mentioned native HTTP but Fastify was already integrated. Fastify provides typed routing, automatic body parsing, and static file serving with minimal overhead. Keep it.
2. **Shared database**: Uses existing `taskmaster` database with `cal_` table prefix.
3. **No roles**: All authenticated users have full CRUD access. `created_by` stored for display only.
4. **Forward-auth trust**: Backend reads X-Forwarded-User directly — no JWT validation needed.
