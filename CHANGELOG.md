# Changelog

All notable changes to the KJUsys Mess Management MFE are documented here.

## [Unreleased]

### Added
- **Holiday Config subtab in Dashboard**: Moved holiday calendar from Reports module into Dashboard > Configure Meal Slots as a new "Holiday Config" subtab, placed alongside existing "Meal Slots", "Display Panel", and "Token Customization" tabs.
- **Calendar grid UI for holidays**: Redesigned `HolidayCalendarComponent` with a full calendar grid featuring month navigation, weekday headers, 7-column day grid, and consecutive holiday range highlighting.
- **Add/Delete holidays from calendar**: Users can add holidays by selecting a date and providing a reason, and delete holidays from the selected date detail panel.
- **Holiday subscription auto-extension (backend)**: When a holiday is created via `POST /schedule/holiday`, the backend now automatically extends `end_Date` by 1 day and increments `duration_days` by 1 for all active subscriptions that overlap the holiday date.
- **Changelog integration for holiday subscriptions**: The `HOLIDAY_MARKED` changelog entry now includes `affectedSubscriptions` (list of roll numbers) and `subscriptionsExtended` (count) so admins can see which subscriptions were adjusted.
- **Frontend changelog display**: `ReportsService.getStudentChangelog()` now renders a human-readable description for `HOLIDAY_MARKED` actions: *"Holiday marked. N subscription(s) extended by 1 day"*.

### Changed
- **Reports module simplified**: Removed Holiday Config subtab, card, and component imports from Reports module. Reports module no longer manages holidays.
- **Holiday calendar uses native date input**: Replaced `lib-date-picker` with native `<input type="date" lang="en-GB">` to avoid `position: fixed` dropdown clipping caused by the modal's `overflow: hidden`. Date format is `dd/mm/yyyy`.

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

---

## [0.0.1] - 2026-06-03

### Added
- Initial commit
- Scaffolded mess-management micro-frontend and integrated into shell manifest and build scripts
