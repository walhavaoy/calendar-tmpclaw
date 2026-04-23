# Calendar Phase 6 — Smoke Test Findings

**Date:** 2026-04-23T11:25:00Z
**Branch:** task/63c61400
**Operator:** automated verification agent

## Results

| # | Check | Result | Detail |
|---|-------|--------|--------|
| 1 | `GET /healthz` returns `{status:'ok'}` | FAIL | HTTP 503: "no available server" — Traefik has no upstream |
| 2 | Pods: `calendar` + `calendar-shell` Running | FAIL | 0 calendar pods, 0 calendar-shell pods in tmpclaw namespace |
| 3 | IngressRoute: two calendar entries | FAIL | 0 calendar IngressRoutes found |
| 4 | TLS: `https://calendar.tmpclaw.io` -> 200 | FAIL | HTTP 503 — no backend service |
| 5 | Shell: `https://shell.calendar.tmpclaw.io` -> 200 | FAIL | HTTP 503 — no backend service |
| 6 | DB: `cal_calendars` table with "Family" row | FAIL | Cannot exec into postgres (403 Forbidden); table likely does not exist |
| 7 | `data-testid` attributes in HTML | FAIL | No HTML served — application not deployed |
| 8 | Mobile CSS `@media max-width:768px` | FAIL | No CSS served — application not deployed |

**Summary: 0/8 PASS, 8/8 FAIL**

## Root Cause Analysis

The calendar component does not exist anywhere in the system:

- **Source code**: Repository contains only `README.md` (single `init` commit on main)
- **Kubernetes**: No `calendar` Deployment, Service, or Pod in the `tmpclaw` namespace
- **Helm**: No `calendar` Helm release installed (`helm list -n tmpclaw` shows 33 releases, none for calendar)
- **IngressRoute**: No calendar-related IngressRoutes configured
- **Database**: Cannot verify (403 on pod exec), but given no deployment exists, `cal_calendars` table is presumed absent

## Evidence

### Cluster state (collected 2026-04-23)
```
$ kubectl get pods -n tmpclaw -l app=calendar
No resources found in tmpclaw namespace.

$ kubectl get pods -n tmpclaw -l app=calendar-shell
No resources found in tmpclaw namespace.

$ kubectl get ingressroute -n tmpclaw -o name | grep -i calendar
(no output)

$ helm list -n tmpclaw | grep calendar
(no output)

$ curl -s https://calendar.tmpclaw.io/healthz
no available server (HTTP 503)

$ curl -s -o /dev/null -w "%{http_code}" https://shell.calendar.tmpclaw.io/
503

$ git log --oneline origin/main
f6c1860 init
```

## Blockers

This is a **Phase 6 task** (smoke test), but prerequisite phases have not been completed:

1. **Phase 1** — Project scaffolding (source code, package.json, TypeScript config)
2. **Phase 2** — Database schema (cal_calendars table, seed data)
3. **Phase 3** — Backend API (/healthz endpoint, calendar CRUD)
4. **Phase 4** — Frontend UI (HTML with data-testid, responsive CSS)
5. **Phase 5** — Helm chart + deployment (Deployment, Service, IngressRoute, TLS)

All five prerequisite phases must be completed and deployed before Phase 6 checks can pass.

## Recommendations

1. Implement Phases 1-5 in dependency order
2. Re-run `calendar/verification/smoke-test.sh` after each phase to track progress
3. Ensure `depends_on` sequencing in taskmaster prevents Phase 6 from activating before Phase 5 completes

## Verification Script

The reusable smoke test script is at `calendar/verification/smoke-test.sh`. Run it after deployment:

```bash
bash calendar/verification/smoke-test.sh
```

Exit code 0 = all checks pass, exit code 1 = one or more failures.
