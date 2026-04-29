---
component: database
area: backend
priority: P0
status: planned
created: 2026-04-29
---

# Database Layer

> PostgreSQL connection management, schema migrations, seeding, and data access functions.

## Purpose

Manages the PostgreSQL connection pool, runs schema migrations on startup, seeds default data, and provides typed data access functions for calendars and events.

## Requirements

### Core

- REQ-DB-01: Connect via DATABASE_URL env var (format: `postgresql://user:pass@host:port/db`) [priority: must]
- REQ-DB-02: Retry DB connection every 5 seconds until connected on startup [priority: must]
- REQ-DB-03: Create `cal_calendars` table with schema: id UUID PK, name TEXT, color TEXT DEFAULT '#8B4513', created_by TEXT, created_at TIMESTAMPTZ [priority: must]
- REQ-DB-04: Create `cal_events` table with schema: id UUID PK, calendar_id UUID FK→cal_calendars ON DELETE CASCADE, title TEXT, description TEXT, location TEXT, start_at TIMESTAMPTZ, end_at TIMESTAMPTZ, all_day BOOLEAN DEFAULT false, created_by TEXT, created_at TIMESTAMPTZ, updated_at TIMESTAMPTZ [priority: must]
- REQ-DB-05: Seed default "Family" calendar with color #8B5E3C if cal_calendars is empty [priority: must]
- REQ-DB-06: Use CREATE TABLE IF NOT EXISTS for idempotent migrations [priority: must]
- REQ-DB-07: Provide CRUD functions for calendars: listCalendars, createCalendar, updateCalendar, deleteCalendar [priority: must]
- REQ-DB-08: Provide CRUD functions for events: listEvents (with from/to filter on start_at), createEvent, getEvent, updateEvent, deleteEvent [priority: must]
- REQ-DB-09: Pool error handling and graceful shutdown [priority: must]

### Extended

- REQ-DB-10: Indexes on cal_events.start_at and cal_events.calendar_id [priority: should]
- REQ-DB-11: Additive ALTER TABLE migrations for future schema changes [priority: should]

## Acceptance Criteria

- Application starts successfully with DATABASE_URL pointing to shared PostgreSQL
- Tables created with `cal_` prefix in the `taskmaster` database
- Default "Family" calendar seeded on first boot
- Connection retries visible in logs on DB unavailability
- All CRUD functions return properly typed results
- Pool closes cleanly on shutdown

## Dependencies

- `pg` npm package
- PostgreSQL at postgres.tmpclaw.svc.cluster.local:5432/taskmaster
- `pino` for logging

## Current State (delta)

| Requirement | Status | Notes |
|-------------|--------|-------|
| REQ-DB-01 | Missing | Uses PG* env vars, not DATABASE_URL |
| REQ-DB-02 | Missing | No retry logic |
| REQ-DB-03 | Missing | No cal_calendars table |
| REQ-DB-04 | Partial | `events` table exists but wrong name, missing calendar_id, all_day, wrong column names |
| REQ-DB-05 | Missing | No seeding |
| REQ-DB-06 | Done | Uses CREATE TABLE IF NOT EXISTS |
| REQ-DB-07 | Missing | No calendar functions |
| REQ-DB-08 | Partial | Event functions exist but wrong signatures/names |
| REQ-DB-09 | Done | Pool error handling and shutdown exist |

## Schema (Target)

```sql
CREATE TABLE IF NOT EXISTS cal_calendars (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  color TEXT NOT NULL DEFAULT '#8B4513',
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS cal_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  calendar_id UUID REFERENCES cal_calendars(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  location TEXT,
  start_at TIMESTAMPTZ NOT NULL,
  end_at TIMESTAMPTZ,
  all_day BOOLEAN DEFAULT false,
  created_by TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_cal_events_start_at ON cal_events (start_at);
CREATE INDEX IF NOT EXISTS idx_cal_events_calendar_id ON cal_events (calendar_id);
```

## Connection String

```
DATABASE_URL=postgresql://tmpclaw:tmpclaw@postgres.tmpclaw.svc.cluster.local:5432/taskmaster
```
