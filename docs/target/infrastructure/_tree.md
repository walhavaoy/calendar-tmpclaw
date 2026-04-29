---
area: infrastructure
status: planned
created: 2026-04-29
---

# Infrastructure Area

> Helm charts, Dockerfile, Traefik IngressRoute, TLS termination.

## Components

| Component | File | Priority | Description |
|-----------|------|----------|-------------|
| calendar-chart | calendar-chart.md | P0 | Helm chart for main calendar app deployment |
| shell-chart | shell-chart.md | P1 | Helm chart for project shell deployment |
| dockerfile | dockerfile.md | P0 | Multi-stage Docker build |

## Current State

All three exist with basic structure. Gaps:
- `chart/values.yaml` uses `tag: latest` (violates PRD)
- `chart/values.yaml` uses PG* env vars instead of DATABASE_URL
- `chart/deployment.yaml` missing resource limits and securityContext
- Dockerfile uses `USER node` instead of `USER 1000:1000`
- Dockerfile missing `TMPCLAW_VERSION` build arg
