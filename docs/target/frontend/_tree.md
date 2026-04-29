---
area: frontend
status: planned
created: 2026-04-29
---

# Frontend Area

> Vanilla JS SPA served from public/ — month grid calendar with sidebar and event modal.

## Components

| Component | File | Priority | Description |
|-----------|------|----------|-------------|
| spa | spa.md | P0 | Full SPA: month grid, calendar sidebar, event modal, responsive layout |

## Current State

Frontend exists (`public/index.html`, `public/app.js`, `public/style.css`) with mostly correct layout and styling. Major gaps:
- Calendars stored in localStorage — must migrate to backend API
- Event data shape mismatch (`start_time`/`end_time` vs PRD `start_at`/`end_at`)
- Missing `data-testid="calendar-event-pill"` on event elements
- Missing `data-testid="calendar-btn-add-event"` on FAB button
- User identity not fetched from `/api/me`
- Logout URL is `/logout`, should be `/_oauth/logout`
- No API calls for calendar CRUD (create/delete calendars)
