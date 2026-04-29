---
component: shell-chart
area: infrastructure
priority: P1
status: planned
created: 2026-04-29
---

# Shell Helm Chart

> Helm chart deploying the project shell at shell.calendar.tmpclaw.io.

## Purpose

Deploys the existing project-shell image as a separate Helm release for the calendar project's management shell.

## Requirements

### Core

- REQ-IS-01: Deployment using project-shell image (localhost:31500/tmpclaw/project-shell, tag from cluster) [priority: must]
- REQ-IS-02: Env vars: K8S_NAMESPACE=tmpclaw, TASKMASTER_URL, PORTAL_URL, PROJECT_ID=5ae245d8-2ed5-446b-9b79-2f885ea282bf [priority: must]
- REQ-IS-03: ServiceAccount: tmpclaw-project-shell (existing, do not create) [priority: must]
- REQ-IS-04: Service: ClusterIP port 3000, name calendar-shell [priority: must]
- REQ-IS-05: IngressRoute: shell.calendar.tmpclaw.io on websecure with TLS letsencrypt [priority: must]
- REQ-IS-06: Middlewares: strip-forwarded-user, forward-auth [priority: must]
- REQ-IS-07: SecurityContext: runAsUser 1000, runAsGroup 1000 [priority: must]

## Acceptance Criteria

- `helm upgrade --install calendar-shell chart-shell/ -n tmpclaw --set image.tag=<tag>` succeeds
- shell.calendar.tmpclaw.io loads the project shell
- Pod uses tmpclaw-project-shell service account
- Correct env vars injected

## Dependencies

- project-shell image in local registry
- tmpclaw-project-shell ServiceAccount exists
- Traefik middlewares exist

## Current State (delta)

| Requirement | Status | Notes |
|-------------|--------|-------|
| REQ-IS-01 | Done | Image configured, tag 1776585047 |
| REQ-IS-02 | Done | All env vars present |
| REQ-IS-03 | Done | ServiceAccount set |
| REQ-IS-04 | Done | Service correct |
| REQ-IS-05 | Done | IngressRoute correct |
| REQ-IS-06 | Done | Middlewares present |
| REQ-IS-07 | Done | SecurityContext present |

**Note**: Shell chart appears complete and functional. Minimal changes needed.
