# Changelog

All notable changes to the KJUsys Mess Management MFE are documented here.

## [Unreleased]

### Added
- **Reports Dashboard** (`reports-dashboard`): New standalone component aggregated from the old analytics dashboard — KPI cards (meals served, active subscribers, absent, paused, anomalies), Today's Meal Utilization bars, Live Tap Activity table with client pagination, and Export Report modal.
- **"View all" routing from dashboard entries-table**: Entries-table "View all" button now routes to `../reports` (Reports Dashboard) for full tap activity visibility.
- **Changelog search (client-side)**: Backend `/changelog` endpoint does not support `roll_number` filter — switched to client-side filtering. Service fetches up to 500 entries, locally filters by roll number (case-insensitive partial match), action type, and date range. Table uses `[clientPagination]="true"`.
- **New changelog action types**: `PAUSE_REQUESTED` (purple badge) and `PAUSE_AUTO_STARTED` (blue badge) added to the action filter dropdown and badge color map in the changelog component.
- **`card_blocked` field** on `Subscriber` interface and `BackendStudent` mapping — supports the card-blocked status check in subscription audit.
- **Filtered export modal** with report type selector (Full Report, Tap Activity, Analytics, Audit, Paused), format (CSV, Excel), optional student roll number, and optional date range. Modal wires to `triggerFilteredExport()` which sends params to `POST /reports/export/trigger` and downloads the returned file blob. Quick path for Taps+CSV with no filters generates client-side.

### Fixed
- **Subscription audit — Check 2 (blocked card)**: Was reading `sub.cardStatus` instead of `sub.card_blocked`. Now correctly checks the `card_blocked` boolean.
- **Subscription audit — Check 3 (unsubscribed meals)**: Was missing the meal-name vs schedule-name comparison. Now cross-references `mealNames` from the subscription against active schedule meals.
- **Subscription audit — Check 4 (taps during pause)**: `pauseStartDate` was being compared as a raw timestamp string instead of parsed `dd/MM/yy` — added `stringToDate()` conversion for correct epoch comparison.

### Changed
- **Entries-table constrained**: Removed `min-h-[738px]` scrolling; replaced with `entries.slice(0, 15)` to cap display at 15 rows with `mb-3` spacing. No max-height or scroll on the table.
- **Reports module simplified**: Removed `AnalyticsDashboardComponent` (replaced by ReportsDashboard). Removed Holiday Config subtab, card, and component imports from Reports module. Reports module no longer manages holidays.
- **Holiday calendar uses native date input**: Replaced `lib-date-picker` with native `<input type="date" lang="en-GB">` to avoid `position: fixed` dropdown clipping caused by the modal's `overflow: hidden`. Date format is `dd/mm/yyyy`.
- **HolidayCalendarComponent decoupled from ReportsService**: Moved component from `reports/components/holiday-calendar/` into `dashboard/components/configure-meal-slots/` — colocated with its only consumer. Added `getHolidays()`, `createHoliday()`, `deleteHoliday()` methods to `DashboardService` to replace the `ReportsService` dependency. No cross-module coupling remains.

### Removed
- **Client-side subscription re-adjustment**: Removed `reAdjustSubscriptionsForHoliday()` from `SubscriberService` and its invocation from `HolidayCalendarComponent`. This logic is now handled server-side.

---

## [0.6.0] - 2026-07-02

### Added
- Student detail revamp with attendance pipeline and pause tracking
- Meal slot day-types (weekday/weekend/holiday) with subscriber dropdowns
- Holiday countdown skip logic
- Token slip customization UI with accordion sections
- Hardcoded default token sections as fallback when DB config is empty

### Fixed
- Purged unused endpoints (settings, block/unblock, DELETE display-config)
- Renew/pause method mismatch; added CDR to stats/table/card/modal/slot/hardware components

---

## [0.5.0] - 2026-07-01

### Added
- Reports module with student explorer, analytics, audit tools, holidays, and student detail
- Token slip customization UI with accordion sections

### Fixed
- Replaced `lib-date-picker` with native input in holiday calendar; added `@libs/date-picker` to `build:lib`
- Purged improper init of reports module
- Removed unused footer

### Changed
- Moved student detail from Reports to Subscriber Management module

---

## [0.4.0] - 2026-06-30

### Added
- Pause start/reason fields, expiry warnings, custom filter panel, non-blocking config loader
- Hardware settings modal with display/printer test bars
- Sticky-bottom floating save button for config sub-tabs

### Fixed
- Hardware connectivity name mismatch and minor fixes
- Increased subscriber fetch limit in dashboard to match subscriber-management module
- Corrected pagination totalItems and optimized initial load for large datasets

---

## [0.3.0] - 2026-06-26

### Added
- Decoupled subscriber form extraction, updated date picker
- New subscriber table reconstruction with search and filtering optimization
- Server-side search, pagination, and filter for subscribers
- Aligned API endpoints with roll_number-based routing

### Changed
- Removed all references of RFID and hmsId (cleanup)

---

## [0.2.0] - 2026-06-22

### Added
- Live dashboard updates via WebSocket with auto-refresh
- Display Panel wired to backend display config API
- Network monitoring service and hardware status refresh capability
- Updated pause functionality and partially implemented hardware status
- Temporary config loader service

### Fixed
- `remoteEntry` URL updated to production for mess-management module
- ChangeDetectorRef issues after merge conflicts

---

## [0.1.0] - 2026-06-18

### Added
- Shell and mess-management projects initialized with Tailwind CSS, environment configurations, and global styles
- Mess management micro-frontend with dashboard and subscriber management modules
- WebSocket service and subscriber management module with API integration
- Meal slot configuration component with CRUD and conflict validation logic
- Subscriber table component with search and filtering
- Subscriber management module with CRUD operations and ID assignment workflow (roll_number)
- Network monitoring service and hardware status refresh capability

### Fixed
- Corrected mapping of paused subscription status
- Renamed `hmsId` to `roll_number` across dashboard and API modules; optimized concurrent data loading in dashboard component

### 2026-07-09 — Student Detail UI/UX Enhancements

**Student Detail component** (`projects/mess-management/src/app/modules/reports/components/student-detail/`)

#### Added
- **Pause & Comp as 4th top-level tab**: Moved from inline section inside Activity & History to its own top-level tab (alongside Overview, Attendance, Activity & History)
- **Events panel**: Holiday/pause reasons shown as colored badge pills (blue for holiday, amber for paused) instead of italic text
- **Holiday reason lookup**: Holiday reasons loaded from API into `holidayMap` and displayed in the yearly meal summary events panel
- **Pause period detection**: `buildPausePeriods()` now recognizes `PAUSE_REQUESTED` and `PAUSE_AUTO_STARTED` actions (not just `PAUSE_STARTED`), with deduplication to avoid duplicate entries

#### Changed
- **Overview attendance cards**: Increased height (`min-h-[130px]`), always-on colored top strip per day status, larger fonts (date→16px, month→12px, pills→11px)
- **Holiday/paused pills**: Overview cards now show single "Holiday"/"Paused" pill (matching Attendance tab style) when day's overall status is holiday/paused, instead of per-meal H/P letters
- **Subscription Milestones scrollable**: List items container has `overflow-y-auto max-h-[500px]` so the header stays fixed while long lists scroll
- **Milestones builder**: Added `PAUSE_REQUESTED` and `PAUSE_AUTO_STARTED` cases alongside `PAUSE_STARTED` for proper display in the timeline

#### Fixed
- **IST morning tap date off-by-one**: Attendance API stores `dayStart` as midnight IST timestamp but derives `rec.date` using UTC — taps before ~5:30 AM IST showed under the previous day. Fixed by computing the local date from `dayStart` directly.
- **Future calendar days showing "Not Tapped"**: Calendar grid pre-rendered all month days with empty meal slots. Future days now show only a muted day number (no meal info, not clickable).

#### Changed
- **Calendar grid meal pills**: Replaced separate "Tapped"/"Not Tapped" text pills with colored meal-name pills (green=tapped, pink=not tapped) — matches the Overview card style, cleaner and more compact.

---

## [0.0.1] - 2026-06-03

### Added
- Initial commit
- Scaffolded mess-management micro-frontend and integrated into shell manifest and build scripts
