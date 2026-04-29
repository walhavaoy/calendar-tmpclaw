---
component: spa
area: frontend
priority: P0
status: planned
created: 2026-04-29
---

# SPA (Single Page Application)

> Vanilla JS calendar SPA with month grid, calendar sidebar, event modal, and responsive design.

## Purpose

Provides the user-facing calendar interface. Served as static files from the Node.js backend. All data fetched from REST API endpoints.

## Requirements

### Core

- REQ-FE-01: Month grid with 7-column layout (Mon-Sun), shows current month by default [priority: must]
- REQ-FE-02: Day cells show day number, up to 3 event pills (colored by calendar), "+N more" overflow [priority: must]
- REQ-FE-03: Top bar with app title, month/year navigation (prev/next), username, logout link [priority: must]
- REQ-FE-04: Left sidebar (200px) with calendar list, colored dots, visibility toggle checkboxes [priority: must]
- REQ-FE-05: "+ New Calendar" button opens inline form with name input + 6 preset color swatches [priority: must]
- REQ-FE-06: Calendar CRUD via API (not localStorage) — create, toggle visibility [priority: must]
- REQ-FE-07: Floating "+ Add Event" FAB button (bottom right) [priority: must]
- REQ-FE-08: Event modal with fields: Title, Calendar dropdown, Date, Start/End time, All-day toggle, Description, Location [priority: must]
- REQ-FE-09: Event modal Save/Delete/Cancel buttons [priority: must]
- REQ-FE-10: Click day cell opens event creation for that date [priority: must]
- REQ-FE-11: Click event pill opens edit modal [priority: must]
- REQ-FE-12: Fetch username from GET /api/me and display in top bar [priority: must]
- REQ-FE-13: Logout navigates to /_oauth/logout [priority: must]

### Styling

- REQ-FE-20: Warm palette: bg #FAF7F2, sidebar #2C1A0E, topbar #3D2410, text #1A0F00, accent #C8860A [priority: must]
- REQ-FE-21: System-ui font family [priority: must]
- REQ-FE-22: Mobile responsive: sidebar collapses to hamburger below 768px [priority: must]
- REQ-FE-23: No horizontal scroll at 375px viewport [priority: must]
- REQ-FE-24: No external CSS frameworks [priority: must]
- REQ-FE-25: Event pill background uses calendar color at 80% opacity [priority: should]

### data-testid Attributes (all required)

- REQ-FE-30: calendar-nav-prev, calendar-nav-next [priority: must]
- REQ-FE-31: calendar-btn-add-event (on FAB) [priority: must]
- REQ-FE-32: calendar-grid-day (on each day cell, with data-date=YYYY-MM-DD) [priority: must]
- REQ-FE-33: calendar-event-pill (on each event element) [priority: must]
- REQ-FE-34: calendar-modal-overlay, calendar-modal-title, calendar-modal-date, calendar-modal-start, calendar-modal-end [priority: must]
- REQ-FE-35: calendar-modal-allday, calendar-modal-calendar-select, calendar-modal-save, calendar-modal-delete, calendar-modal-cancel [priority: must]
- REQ-FE-36: calendar-sidebar-item, calendar-sidebar-toggle, calendar-sidebar-add, calendar-sidebar-name-input, calendar-sidebar-save [priority: must]

## Acceptance Criteria

- Month grid renders with correct days and navigation works
- Events appear as colored pills on correct dates
- Calendar sidebar lists all calendars from API with toggle functionality
- New calendars created via API, persist across reload
- Events created/edited/deleted via API, persist across reload
- Username displayed in top bar from /api/me
- All data-testid attributes present and correct
- Mobile viewport (375px) renders without horizontal scroll
- Sidebar collapses to hamburger on mobile

## Dependencies

- Backend API endpoints (/api/me, /api/calendars, /api/events)
- No external JS or CSS dependencies

## Current State (delta)

| Requirement | Status | Notes |
|-------------|--------|-------|
| REQ-FE-01-02 | Done | Month grid renders correctly |
| REQ-FE-03 | Partial | Top bar exists, username not from API |
| REQ-FE-04-05 | Done | Sidebar with calendars and new calendar form |
| REQ-FE-06 | Missing | Calendars in localStorage, not API |
| REQ-FE-07 | Done | FAB exists |
| REQ-FE-08-11 | Done | Event modal and interactions work |
| REQ-FE-12 | Missing | No /api/me fetch |
| REQ-FE-13 | Wrong | Uses /logout, should be /_oauth/logout |
| REQ-FE-20-24 | Done | Styling matches PRD |
| REQ-FE-31 | Missing | FAB missing data-testid="calendar-btn-add-event" |
| REQ-FE-33 | Missing | Events missing data-testid="calendar-event-pill" |
