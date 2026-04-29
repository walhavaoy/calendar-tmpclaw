---
component: api-server
area: backend
priority: P0
status: planned
created: 2026-04-29
---

# API Server

> Fastify-based REST API serving calendar and event CRUD, user identity, health checks, and static frontend files.

## Purpose

Provides all REST endpoints for the calendar application. Serves the SPA frontend from `public/`. Reads user identity from the `X-Forwarded-User` header set by Traefik forward-auth middleware.

## Requirements

### Core

- REQ-BE-01: GET /healthz returns `{status: "ok", version: string}` [priority: must]
- REQ-BE-02: GET /api/me returns `{user: string}` from X-Forwarded-User header [priority: must]
- REQ-BE-03: GET /api/calendars returns all calendars from cal_calendars [priority: must]
- REQ-BE-04: POST /api/calendars creates a calendar with `{name, color}`, sets `created_by` from X-Forwarded-User [priority: must]
- REQ-BE-05: PUT /api/calendars/:id updates calendar `{name, color}` [priority: must]
- REQ-BE-06: DELETE /api/calendars/:id deletes calendar (cascades to events) [priority: must]
- REQ-BE-07: GET /api/events?from=YYYY-MM-DD&to=YYYY-MM-DD returns events filtered by start_at range, includes calendar_id, title, start_at, end_at, all_day, created_by [priority: must]
- REQ-BE-08: POST /api/events creates event with `{calendar_id, title, description, location, start_at, end_at, all_day}`, sets `created_by` from X-Forwarded-User [priority: must]
- REQ-BE-09: PUT /api/events/:id updates any event fields [priority: must]
- REQ-BE-10: DELETE /api/events/:id deletes event [priority: must]
- REQ-BE-11: Serve static files from public/ directory at / [priority: must]
- REQ-BE-12: Use pino for all logging (no console.log) [priority: must]
- REQ-BE-13: Graceful shutdown on SIGTERM/SIGINT [priority: must]
- REQ-BE-14: Listen on port 8080 (configurable via PORT env) [priority: must]

### Extended

- REQ-BE-20: Input validation on all POST/PUT endpoints (title required, valid UUID params) [priority: should]
- REQ-BE-21: Return 404 for missing resources, 400 for invalid input [priority: should]

## Acceptance Criteria

- All endpoints return correct JSON shapes per REST API spec
- X-Forwarded-User header is used for `created_by` on all create operations
- `/api/me` returns the authenticated username
- Events filtered by date range correctly
- Static files served at root path
- Health check returns version from package.json or TMPCLAW_VERSION env

## Dependencies

- database component (schema, pool, CRUD functions)
- Fastify + @fastify/static packages
- pino logger

## Current State (delta)

| Requirement | Status | Notes |
|-------------|--------|-------|
| REQ-BE-01 | Partial | Returns {status:ok} but no version |
| REQ-BE-02 | Missing | No /api/me endpoint |
| REQ-BE-03-06 | Missing | No calendar CRUD |
| REQ-BE-07 | Partial | Events exist but wrong field names, no calendar_id |
| REQ-BE-08-10 | Partial | Events CRUD exists but wrong schema |
| REQ-BE-11 | Done | Static serving works |
| REQ-BE-12 | Done | Pino used |
| REQ-BE-13 | Done | Graceful shutdown implemented |
| REQ-BE-14 | Done | Port 8080 |
