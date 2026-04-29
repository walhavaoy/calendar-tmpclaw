---
component: dockerfile
area: infrastructure
priority: P0
status: planned
created: 2026-04-29
---

# Dockerfile

> Multi-stage Docker build for the calendar application.

## Purpose

Builds a production container image with TypeScript compilation in stage 1 and minimal runtime in stage 2.

## Requirements

### Core

- REQ-DF-01: Multi-stage build with node:22-slim base [priority: must]
- REQ-DF-02: Stage 1: npm ci + tsc compilation [priority: must]
- REQ-DF-03: Stage 2: npm ci --omit=dev + copy dist/ + copy public/ [priority: must]
- REQ-DF-04: EXPOSE 8080 [priority: must]
- REQ-DF-05: USER 1000:1000 (not USER node) [priority: must]
- REQ-DF-06: CMD ["node", "dist/index.js"] [priority: must]
- REQ-DF-07: Build arg TMPCLAW_VERSION [priority: must]

## Acceptance Criteria

- `docker build -t calendar:test .` succeeds
- Container runs as UID 1000
- Application starts and serves on port 8080
- public/ files accessible in container

## Current State (delta)

| Requirement | Status | Notes |
|-------------|--------|-------|
| REQ-DF-01 | Done | Uses node:22-slim via BASE_IMAGE arg |
| REQ-DF-02 | Done | npm ci + npm run build |
| REQ-DF-03 | Done | Copies dist/ and public/ |
| REQ-DF-04 | Done | EXPOSE 8080 |
| REQ-DF-05 | Wrong | Uses `USER node`, should be `USER 1000:1000` |
| REQ-DF-06 | Done | CMD correct |
| REQ-DF-07 | Missing | No TMPCLAW_VERSION build arg |
