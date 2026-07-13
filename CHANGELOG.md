# Changelog

All notable changes to the KJUsys Mess Management MFE are documented here.

## [Unreleased]

### Added
- **dayPreference-aware dashboard stats**: `DashboardComponent` now splits active subscriber counts by `dayPreference` (all/weekday/weekend). `getExpectedActiveToday()` filters by current day type — absent count uses day-appropriate total instead of all active subscribers. Meal slot eligible counts respect day type (e.g. weekend-only subscribers count only on weekends).
- **`expectedActiveToday` to Reports Dashboard KPI**: New KPI card replaces redundant "Absent Today" with "Expected Subscribers Today" — reflects dayPreference-filtered expected count. Anomaly KPI card and its data loading removed.
- **`expectedActiveToday` field** to `DailyAnalytics` model with backend fallback.
- **`dayPreference` field** to `StudentOverview` model and `ReportsService` mapping.
- **Student Detail `not_applicable` status**: Overview cards, Attendance calendar, and subscription heatmap show muted "N/A" pills/gray backgrounds for dates outside the student's `dayPreference` (e.g. weekends for weekday-only subscribers). `isApplicable()` method filters attendance/meal summary computations.
- **Student Detail `studentNotFound` empty state**: When API returns no data or errors, shows `<lib-empty-state>` with "Student Not Found" instead of a blank page.
- **`parseBackendDate()` helper** in `DashboardService` — converts `dd-MM-yyyy` string (from backend `processResponseDocument`) to epoch millis for holiday calendar date-key mapping.
- **Holiday calendar month-grouped accordion**: Click-to-view-detail panel replaced with single-expand accordion grouped by month. Most recent month auto-expands. Items show red left-strip (`#EF4444`) and holiday reason.
- **Holiday calendar red color scheme**: Holiday cells use `#FEE2E2` background, `#991B1B` text, `#EF4444` borders and accents (replaced amber tones).
- **Holiday calendar cell layout**: Cells have `3rem` height, `1px solid #E5E7EB` border, `6px` border-radius, backgrounds fill the full cell for selected/today/holiday states.

### Changed
- **Audit Tools subtabs**: Removed "Anomaly Detector" and "Subscription Audit" subtabs. Reordered to "Change Log" then "Pause Audit". Default tab is now Change Log. Removed `PillTabsModule`, `DashboardService`, `SubscriberService` imports/providers. Removed `SubscriptionIssue` interface, `PillTabItem`, anomaly/sub-audit columns, data, loading states, and all handler methods (`loadAnomalies()`, `onSeverityTabChange()`, `runSubscriptionAudit()`, `computeSubscriptionIssues()`).
- **Changelog table default rows**: Reduced from 30 to 10 per page.
- **Changelog filter options**: Removed `CARD_BLOCKED` and `CARD_UNBLOCKED` action types from dropdown and badge color map.
- **Student Detail `ACTION_COLORS`/`ACTIVITY_COLORS`**: Removed `CARD_BLOCKED`/`CARD_UNBLOCKED` entries.
- **`subscriber-management.component.ts`**: Query param `student` is no longer cleared on component init — navigation to `backFromStudentDetail()` handles it on explicit back navigation.
- **Hardware settings modal**: Removed fixed footer (Close button) from bottom.

### Fixed
- **Holiday calendar not rendering seeded holidays**: `getHolidays()` now maps backend fields (`_id` → `id`, `date_Date` → `date`) with proper `dd-MM-yyyy` → millis parsing via `parseBackendDate()`. Previously `h.date` was `undefined` because the API returned `date_Date` as the key, causing `buildHolidayMap()` to skip all holidays.
- **dayPreference not persisted on subscriber create**: `SubscriberFormComponent.ngOnChanges()` was replacing the entire form when `mealSlots` loaded asynchronously, discarding user input including `dayPreference`. Changed to only re-initialize on `initialData` changes (edit flow), with the form always initialized once in `ngAfterViewInit`.
- **Add holiday form payload field name**: `DashboardService.createHoliday()` was sending `{ date: dateMillis, reason }` but backend expects `date_Date`. Fixed payload field to `date_Date`.

### Removed
- **Recurring holiday repeat feature**: Removed after implementation — repeat type pills (None/Weekly/Monthly), weekly day-of-week toggle, monthly day-of-month auto-fill, optional repeat end date, and repeat badge in accordion list. `HolidayRecord.repeat`, `repeatDayOfWeek`, `repeatDayOfMonth`, `repeatEndDate` fields and corresponding `createHoliday()` parameters removed. Backend `markHoliday()` no longer stores repeat fields.

### Removed
- **`card_blocked` from entire frontend**: Removed from `Subscriber`, `BackendStudent` interfaces, `subscriber.service.ts` mapping, `quick-modal.component.ts` cardStatus display, `reports.service.ts` overview mapping (always `'Active'`).
- **Anomaly Detector subtab**: Entire anomaly detection UI, data models, severity pill filters, anomaly table columns, and API loading logic removed from Audit Tools.
- **Subscription Audit subtab**: Entire subscription audit UI, data models, `SubscriptionIssue` interface, and audit computation logic removed from Audit Tools.
- **Anomaly KPI card**: Removed from Reports Dashboard — including anomaly count fetch and KPI card display.
- **`PillTabsModule` import**: No longer needed after anomaly subtab removal.
- **Case-insensitive roll number input**: Student roll number field in export modal auto-uppercases typed text for better UX. Backend matches roll numbers case-insensitively.
- **Copy-to-clipboard toasts in HMAC popup**: Copying HMAC Secret or Device Token now shows a toast notification confirming the copy. Icons revert after 2s to allow repeated copies.
- **3am-pivot meal slot sorting utility** (`shared/constants/meal-sort.ts`): `compareMealStartTimes()`, `mealNameToMinutes()`, `timeToMinutes()`, `sortByMealTime()`. Meals before 3am (Midnight Snack, Late Night) sort after all others across the entire application.
- **Meal slot sorting applied to**: `MealSlotService` (create/update), `DashboardService.getSchedules()`, `ConfigureMealSlotsComponent` (add/update + initial load), `ReportsService.getStudentAttendance()`, `StudentDetailComponent` (loadAttendance + buildMealSummary).
- **Enhanced export modal with rich filters**: Reports Dashboard export modal redesigned with date range picker (`<lib-date-picker>`), multi-select meal slot dropdown (`<lib-dropdown-lib>`), comma-separated student roll number input, and Summary/Data sheet toggles.
- **Multi-sheet Excel output**: Backend now generates 2-sheet workbooks — Summary (KPIs + per-meal-slot breakdown) and Data (full tap detail). Filter params: `mealSlots`, `statuses`, `rollNumbers`, `includeSummary`, `includeDetail`.
- **Date picker in export modal**: Uses `<lib-date-picker>` from `@libs/date-picker` for consistent date range selection (replaced native `<input type="date">`).
- **Meal slot multi-select dropdown**: `<lib-dropdown-lib>` from `@libs/dropdown-lib` with all 7 meal slot options sorted by 3am pivot (Early Breakfast, Breakfast, Brunch, Lunch, Dinner, Late Night, Midnight Snack).
- **Sheet toggle switches**: Two checkbox-style toggles for including Summary and Data sheets, with visual state indicator.
- **Export progress indicator**: Animated spinner with status text during report generation.
- **Export output preview**: Shows which sheets will be included based on toggle state.

### Changed
- **Student-detail component moved**: Relocated from `reports/components/student-detail/` to `subscriber-management/components/student-detail/` — colocated with its only consumer. Updated all import paths.
- **Breadcrumbs show roll number**: `subscriber-management.component.ts` breadcrumbs now dynamically include the selected student's roll number as a third crumb (e.g. `Hostel > Mess Management > 25MCAB24`).
- **Student detail calendar design fixes**: Holiday/paused pills now sized as single meal slot (was full-width block). All meal/holiday/paused pills right-aligned in both weekly overview and monthly attendance calendar. Holiday color changed from blue (`#DBEAFE`/`#1E40AF`) to red (`#FEE2E2`/`#991B1B`). Heatmap strip removed from attendance calendar day cells.
- **Hardware settings modal design refinements**: Increased subtitle margin-bottom (`mb-4`) for better spacing. Replaced `<lib-button>` copy buttons in HMAC popup with icon-only copy/check icons (16px, 32×32 button) — label and icon now use `flex justify-between`. Register Device button right-aligned. MAC address placeholder simplified to "Device MAC address".
- **Export button relocated to sub-tabs header**: Export button moved from the dashboard card to the sub-tabs header row in `reports.component.html` using `flex justify-between` layout. `reports.component.ts` uses `@ViewChild(ReportsDashboardComponent)` to call `openExportModal()`. `ButtonComponent` added to `reports.module.ts`.
- **Reports Dashboard component** (`reports-dashboard.component.ts`): Added `DatePickerModule` and `DropdownLibModule` imports. Rewrote export modal with enhanced filter state variables (`exportStartDate`, `exportEndDate`, `exportRollNumbersInput`, `selectedMealSlots`, `exportIncludeSummary`, `exportIncludeDetail`, `exportFormat`). Updated `onGenerateExport()` to build enhanced filter params with format selection. Added `closeExportModal()` with full state reset including format. Added `openExportModal()` public method. Removed standalone export card from dashboard.
- **`ReportsService.triggerFilteredExport()`**: Updated params interface to accept `mealSlots?: string[]`, `statuses?: string[]`, `rollNumbers?: string[]`, `includeSummary?: boolean`, `includeDetail?: boolean`.
- **Hardcoded `availableMealSlots` reordered**: Reports dashboard dropdown now lists meals in 3am-pivot order (Early Breakfast → Midnight Snack).

### Removed
- **Today's Meal Utilization card**: Removed from Reports Dashboard. Removed `MealBar` interface, `mealBars` array, `barColors`, `buildMealBars()`, and unused `MealDistribution` import.
- **Native date inputs in export modal**: Replaced `<input type="date">` with `<lib-date-picker>` for consistent UX.
- **HMAC secret popup with dual credentials**: After registering or rotating a secret, the popup now shows two values: **HMAC Secret** (for signing requests) and **Device Token** (SHA-256 hash, for device identification). Each has its own copy button.
- **Rotate secret confirmation modal**: Clicking "Rotate Key" now opens an inline confirmation popup (matching the delete confirmation pattern) instead of a browser `confirm()` dialog.
- **Pairing flow**: Removed all pairing-related logic from the hardware settings modal — `subTabs`, `activeTab`, `pairingActive`, `pairingCountdown`, `pairingTimer`, `pendingDevices`, `pendingPollingTimer`, `startPairing()`, `stopPairing()`, `startPendingPolling()`, `stopPendingPolling()`, `loadPendingDevices()`, `confirmDevice()` (manual entry). Removed `SubTabsModule` import from the component.

### Changed
- **Hardware settings modal flat layout**: Removed sub-tabs (Devices / Pairing). New layout: "Register New Device" form at top, "Registered Devices" list below. No more pairing window, countdown timer, or pending device polling.
- **`HARDWARE_CONNECT` endpoint added** to `api-endpoints.ts`. `HARDWARE_HEARTBEAT` updated to `/hardware/heartbeat` (no longer takes `id` param).
- **`HardwareManagementService.connectDevice()`** returns `{ device, hmacSecret, hmacSecretHash }`.
- **`HardwareManagementService.rotateSecret()`** returns `{ newSecret, newSecretHash }`.

---

## [Unreleased] (earlier)

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
- **dayPreference lost on edit**: `BackendStudent` interface and `mapToSubscriber` didn't include `dayPreference`, so editing a subscriber always showed "All Days". Added `dayPreference` to `BackendStudent`, `Subscriber`, and the mapper.

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
- **dayPreference lost on edit**: `BackendStudent` interface and `mapToSubscriber` didn't include `dayPreference`, so editing a subscriber always showed "All Days". Added `dayPreference` to `BackendStudent`, `Subscriber`, and the mapper.

#### Changed
- **Calendar grid meal pills**: Replaced separate "Tapped"/"Not Tapped" text pills with colored meal-name pills (green=tapped, pink=not tapped) — matches the Overview card style, cleaner and more compact.

---

## [0.0.1] - 2026-06-03

### Added
- Initial commit
- Scaffolded mess-management micro-frontend and integrated into shell manifest and build scripts
