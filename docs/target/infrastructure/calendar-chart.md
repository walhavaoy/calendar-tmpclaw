---
component: calendar-chart
area: infrastructure
priority: P0
status: planned
created: 2026-04-29
---

# Calendar Helm Chart

> Helm chart deploying the calendar app: Deployment, Service, IngressRoute with TLS.

## Purpose

Deploys the calendar application container to the tmpclaw Kubernetes namespace with proper networking, TLS, and forward-auth middleware.

## Requirements

### Core

- REQ-IC-01: Deployment with image from values.yaml (repository: localhost:31500/calendar-tmpclaw/calendar, tag required — no :latest) [priority: must]
- REQ-IC-02: Environment variables: DATABASE_URL, TRUST_FORWARD_AUTH=true, NODE_ENV=production [priority: must]
- REQ-IC-03: Resource requests: cpu 50m, memory 64Mi. Limits: cpu 200m, memory 256Mi [priority: must]
- REQ-IC-04: SecurityContext: runAsUser 1000, runAsGroup 1000 [priority: must]
- REQ-IC-05: Service: ClusterIP port 8080 [priority: must]
- REQ-IC-06: IngressRoute: calendar.tmpclaw.io on websecure entrypoint with TLS certResolver letsencrypt [priority: must]
- REQ-IC-07: Middlewares: strip-forwarded-user, forward-auth [priority: must]
- REQ-IC-08: HTTP-to-HTTPS redirect IngressRoute on web entrypoint [priority: must]
- REQ-IC-09: Readiness and liveness probes on /healthz [priority: should]

## Acceptance Criteria

- `helm upgrade --install calendar chart/ -n tmpclaw --set image.tag=<timestamp>` succeeds
- Pod runs as UID 1000:1000
- DATABASE_URL env var set correctly in pod
- IngressRoute routes calendar.tmpclaw.io to service
- TLS certificate obtained via letsencrypt
- HTTP requests redirected to HTTPS

## Dependencies

- Container image built and pushed to localhost:31500
- Traefik IngressController with forward-auth and strip-forwarded-user middlewares
- PostgreSQL accessible at postgres.tmpclaw.svc.cluster.local

## Current State (delta)

| Requirement | Status | Notes |
|-------------|--------|-------|
| REQ-IC-01 | Partial | Uses tag: latest in values.yaml |
| REQ-IC-02 | Wrong | Uses PG* env vars, missing DATABASE_URL, TRUST_FORWARD_AUTH, NODE_ENV |
| REQ-IC-03 | Missing | resources: {} in values.yaml |
| REQ-IC-04 | Missing | No securityContext in deployment |
| REQ-IC-05 | Done | Service ClusterIP 8080 |
| REQ-IC-06 | Done | IngressRoute for calendar.tmpclaw.io with TLS |
| REQ-IC-07 | Done | Middlewares present (also has cors-mobile) |
| REQ-IC-08 | Done | HTTP redirect IngressRoute exists |
| REQ-IC-09 | Done | Health probes configured |
