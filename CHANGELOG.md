# Changelog

All notable changes to the KJUsys Mess Management MFE are documented here.

## [Unreleased]

### Added
- **Skeleton screens**: Shimmer loading placeholders for student detail (overview stats cards, detail grid, 7-day attendance), dashboard stats cards, quick modal, hardware settings modal, and holiday calendar. All loading flags initialized as `true` so skeletons are the initial render state.
- **Error state tracking**: `overviewError`, `attendanceError`, `changelogError`, `historyError`, `pauseError` variables added to student detail; `loadError` in holiday calendar. Error callbacks updated to capture `err` object for future UI use.
- **`countEligibleDays()` in `SubscriberService`** and **`ReportsService`**: Computes eligible days client-side based on day preference (weekday/weekend/all), used by subscriber form renew threshold and reports days-remaining.
- **`loadHolidays` error handler in student detail**: Added silent `error: () => {}` to prevent unhandled RxJS notification.

### Changed
- **Status dropdown in subscriber form**: Replaced custom hand-built dropdown with `lib-dropdown-lib` (single select) for consistency with other dropdowns.
- **Pause section styling**: Separated into independent bordered container (`border border-gray-200 rounded-[10px] px-5 py-5 bg-white shadow-sm`).
- **Renew section redesign**: Initial state shows a "Renew Now" secondary button; expands to date picker + month-based preset pills (1M, 3M, 6M, 1Y) + Cancel/Confirm buttons. Presets changed from day-based (`{ days: 30 }`) to month-based (`{ months: 1 }`). Uses `SharedToastService.success()` for renewal confirmation instead of inline success message.
- **Add/Edit subscriber modal height**: Increased from `700px` to `720px`.
- **Student detail "Meal Slots"**: Changed to "Day Preference" with human-readable labels (Weekdays Only / Weekends Only / All Days).
- **Last name validation relaxed**: Only validates format if provided; no longer required.
- **`SUPER_USER_CREATED` color** added to `audit-tools` badge color map (purple `#F3E8FF` / `#7C3AED`).
- **Hardware status heading**: Renamed "System Uptime" to "System Status".

### Fixed
- **Loading states initialized as `true`**: Skeleton screens now appear immediately on component mount instead of showing empty content briefly before snapping to loaded state.
- **Overview error no longer forces "Student Not Found"**: Error handler sets `overviewError` instead of unconditionally setting `studentNotFound = true`.

### Added
- **Holiday-aware meal slot badge**: When today is a configured holiday and a meal slot's `daysAvailable` doesn't include `'holiday'`, a yellow **Holiday** badge replaces the original status badge in the Configure Meal Slots modal.
- **Current month holidays in Holiday Calendar**: The Holidays Configured section now shows holidays for the currently viewed calendar month at the top, with an empty state variant when none exist. The accordion hides that month to avoid duplication.
- **Delete confirmation modal for holidays**: Replaced native `confirm()` dialog with the project-standard inline delete modal (exclamation icon, cancel/confirm buttons).

### Changed
- **Holiday accordion default state**: Accordion months now start collapsed instead of auto-expanding the first month.
- **Holiday Configured scroll**: Removed inner `max-h-[320px]` scroll — the modal's own scroll container handles overflow.

### Fixed
- **Export file naming**: Report exports now use descriptive filenames reflecting the export configuration (e.g. `mess.today.2026-07-21.xlsx`, `mess.report.2026-07-01-to-2026-07-21.breakfast-lunch.students.2026-07-21.xlsx`) instead of generic `report-YYYY-MM-DD.xlsx`.
- **Meal slot "Live" status persisting after slot ends**: Status was computed once on page load and never refreshed. Added a 30-second interval in `DashboardComponent` that recalculates status for all meal slots.
- **Meal slot status incorrect on non-IST browsers**: `computeMealSlotStatus` used `new Date()` (browser local time) but meal times are in IST. Now computes current time by applying the IST offset (+5:30) to UTC epoch and reading via `.getUTCHours()`/`.getUTCMinutes()` — timezone-independent.
- **`MealSlotService.mapToMealSlot()` always used weekday schedule**: Now detects current day type and uses the appropriate `weekday`/`weekend` schedule.

### Changed
- **Absent Today card**: Now uses `absentCount` from backend API instead of computing `expectedActiveToday - totalTaps` client-side. Backend accurately counts students who missed all their subscribed meal slots.
- **Status computation extracted** into shared `computeMealSlotStatus()` in `shared/services/meal-slot-utils.ts`. All three consumers (`DashboardService`, `MealSlotService`, `ConfigureMealSlotsComponent`) now call the same function.

### Added
- **Super User support in subscriber form**: Checkbox to toggle Super User status on add/edit. Confirmation popup warns before setting. When enabled, clears all meal/pause data. Super Users bypass subscription, meal slot, and day preference requirements.
- **Super User status in subscriber table**: `'Super User'` added to status filter dropdown with purple badge color (`#7C3AED33` / `#7C3AED`).
- **Super User banner in student detail**: Purple dashed banner shown for super users. Attendance, Pause & Comp tabs hidden. Taps counted without attendance rate.
- **Super User in reports**: `StudentOverview` model includes `superUser` field. `subscription` is `undefined` for super users. Status mapped as `'super_user'`.
- **Renew section in subscriber form**: Edit-mode-only section shown when subscription is near expiry or lapsed. Preset pills (1 Month, 3 Months, 6 Months, 1 Year). Calls `POST /students/:roll_number/renew`.
- **Renew form date sync**: After successful renewal, `form.mealSlot.endDate` updated from API response (`new_end_Date`), date pickers refreshed, validation re-run.
- **Renew for lapsed subscriptions**: Renew section now visible even when `daysRemaining <= 0` (lapsed), with "Subscription has lapsed — renew to reactivate" text.
- **Renew error feedback**: `renewError` state displays API error messages below the renew section.
- **Subscription duration presets**: 1 Month, 3 Months, 6 Months, 1 Year pill buttons below the subscription date picker.
- **`pauseTouched` flag in subscriber form**: Pause section validation messages only appear after user interacts with pause fields (date picker or reason input), not on initial load.
- **`resolveNumeric()` helper** in `ReportsService` and `SubscriberService`: Handles MongoDB `$numberLong` objects and numeric type coercion for timestamp fields.
- **`SUPER_USER_CREATED` color entries** in `StudentDetailComponent` action/activity color maps (purple `#7C3AED`).

### Changed
- **Pause validation consolidated**: Two separate "Pause start date is required" / "Pause end date is required" messages replaced with single "Pause start and end required" line.
- **Super User checkbox repositioned**: Moved to right side of form via `justify-end`.
- **Email validation**: Added empty check before regex — shows "Email is required" instead of "Invalid email address" for blank input.
- **Date validation**: `validateDates()` now returns `'Subscription period is required'` when dates are empty (previously returned `null`).
- **`Subscriber.status` type**: Changed from `'Active' | 'Paused' | 'Lapsed'` union to `string` to accommodate `'Super User'`.
- **`StudentSubscriptionSummary` model**: `startDate` and `endDate` changed from `string` to `number` (epoch millis).
- **`StudentOverview` model**: `subscription` made optional, `superUser` field added.
- **`subscriber-form.service.ts`**: `validateForm()` skips date/mealSlot validation for super users. `populateForm()` reads `superUser` from subscriber. `initializeForm()` defaults `superUser: false`.
- **`subscriber.service.ts` `createSubscriber()`**: Early returns for super users without subscription data.
- **`subscriber.service.ts` `updateSubscriber()`**: Includes `superUser` in payload, skips subscription merge when setting super user.
- **`mapToSubscriber()`**: Uses `resolveNumeric()` for all timestamp fields. Super users get `'Super User'` status/mealPlan, empty expiry warning.
- **`BackendStudent` interface**: `subscription` made optional, `superUser` field added.

### Fixed
- **Renew not persisting**: `onRenew()` now reads `res.responseData.data.new_end_Date` from API and updates `form.mealSlot.endDate` + date pickers. Previously the old end date was sent on subsequent "Update" click, overwriting the renewal.
- **Renew hidden for lapsed subscriptions**: `showRenewSection` removed `remaining <= 0` guard — renew section now appears for both expiring and lapsed subscriptions.
- **Renew silent failures**: Error handler now sets `renewError` with API message or fallback text.
- **Pause validation messages showing on load**: Gated behind `pauseTouched` flag instead of `formTouched`, preventing messages from appearing when edit modal opens for a Paused subscriber.
- **Validation error overwriting `firstName`**: Removed `errors.firstName = dateError` from `subscriber-form.service.ts` — date errors are handled separately via `dateError` in the component.

### Removed
- **Test printer/display buttons from hardware settings modal**: Removed inline "Test" buttons, `testingPrintDeviceId`/`testingDisplayDeviceId` state, `markPendingCommand()`, `getPendingCommandSeconds()`, `hasPendingCommand()`, `testPrinter()`, `testDisplay()` methods, and `pendingCommandTimestamps` map.
- **`testPrinter()`, `testDisplay()` from `HardwareManagementService`**: HTTP methods removed.
- **`HARDWARE_TEST_PRINTER`, `HARDWARE_TEST_DISPLAY`, `HARDWARE_STOP` API endpoint constants**: Removed from `api-endpoints.ts`.
- **`stopDevice()` from `HardwareManagementService`**: HTTP method removed.
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

### Added
- **Changelog action filters**: `audit-tools.component.ts` — added `HOLIDAY_DELETED`, `TAP_REJECTED`, `SCHEDULE_CREATED`, `SCHEDULE_MODIFIED`, `SCHEDULE_DELETED` to action filter dropdown and badge color map
- **Student Detail activity filter options**: Dynamically derived from present actions via `get activityFilterOptions()`. Added `recentActivityPreview` getter (first 6 entries)
- **Student Detail icon mappings**: `SCHEDULE_CREATED`, `SCHEDULE_MODIFIED`, `SCHEDULE_DELETED` → `'calendar'`, `SUBSCRIPTION_EXPIRED` → `'alert'`

### Changed
- **Tabs subtitle unified**: `dashboard.component.ts`, `reports.component.ts`, `subscriber-management.component.ts` — tab subtitle changed from `'Overview'` to `'Dashboard Overview'` for consistency
- **Add/Edit subscriber modal height**: Reduced from `800px` → `700px`, `max-h-[92vh]` → `max-h-[90vh]` for a more compact layout
- **Subscriber form date pickers** (`subscriber-form.component.ts/.html`): Replaced 4 custom inline date pickers (~250 lines) with 2 `<lib-date-picker>` range pickers (`#subDatePicker`, `#pauseDatePicker`). Removed `togglePicker()`, `prevMonth()`, `nextMonth()`, `getCalendarDays()`, `isSelected()`, `isInRange()`, `isBoundaryDate()`, `isBoundaryStart/End()`, `selectDay()`, `clearDate()`, `confirmDate()`, `selectPauseStartDay()`, `selectPauseEndDay()`, `clearPauseStartDate()`, `confirmPauseStartDate()`, `isPauseStartBoundaryDate()`, `isPauseStartInRange()`, `isSelectedPauseEnd()`, `isPauseInRange()`, `isPauseRangeStart()`, `isPauseRangeEnd()`, `syncViewDates()` methods, `showStartPicker`/`showEndPicker`/`showPauseEndPicker`/`showPauseStartPicker` states, `popupTop`/`popupLeft` positioning, `startViewDate`/`endViewDate`/`pauseEndViewDate`/`pauseStartViewDate` view dates, `months` array, `weekDays` array. Added `DatePickerModule` + `DatePickerComponent` imports, `@ViewChild('subDatePicker')`/`@ViewChild('pauseDatePicker')`, `pushDatesToDatePickers()`, `onSubscriptionRangeSelect()`, `onSubscriptionRangeClear()`, `onPauseRangeSelect()`, `onPauseRangeClear()`, date-value getters. `onDocClick` now only closes status dropdown. `closeAllDropdowns()` closes lib date pickers via `isOpen` property
- **CSS** (`subscriber-form.component.css`): Removed `.calendar-popup` fadeIn animation, added `::ng-deep .date-picker-trigger` styling to match form input height/padding
- **Student Detail** (`student-detail.component.ts`): `buildPausePeriods()` now recognizes `PAUSE_REQUESTED` and `PAUSE_AUTO_STARTED` actions. Milestones builder includes `PAUSE_REQUESTED`/`PAUSE_AUTO_STARTED`. Events panel date rendering looks up holiday reason from `holidayMap` and pause reason from `pausePeriods`
- **Subscriber table filter dropdown**: "Clear All" button changed from `text-gray-500` to `text-red-600`
- **Reports service days-remaining** (`reports.service.ts`): Changed from `Math.ceil((effectiveEnd - Date.now()) / 86400000)` to `Math.floor((effectiveEnd - todayStartTs) / 86400000) + 1` — end date day itself counts fully

### Fixed
- **Subscriber expiry filter** (`subscriber-management.component.ts`): `filterByExpiry` changed `endTs > now` to `endTs >= todayStartTs` — subscribers expiring today now correctly included in 7-day filter
- **Subscriber service expiry warning** (`subscriber.service.ts`): Now shows `'expires today'` when `daysUntilExpiry === 0`. Changed reference from `Date.now()` to `todayStartTs` for consistent boundary comparison
- **Quick modal expired status** (`quick-modal.component.ts`): `now > sub.end_Date` → `todayStartTs > sub.end_Date` — subscriber not expired on their end date day
- **Student search expired status** (`student-search.component.ts`): `Date.now() > sub.end_Date` → `todayStartTs > sub.end_Date` — same boundary fix
- **Reports service expired/paused detection** (`reports.service.ts`): `now > sub.end_Date` → `todayStartTs > sub.end_Date`. `hasEndedPause` uses `todayStartTs` instead of `now`. Pause status check uses `now` for active window but boundary comparisons consistently use `todayStartTs`

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

#### Changed
- **Holiday Config form repositioned**: "Add Holiday" form and instruction info moved from below the calendar to above it in `holiday-calendar.component`
- **Holiday Config instruction text**: Added blue info banner inside the form explaining users can type a date or click the calendar
- **Student Detail meal summary synced with weekly view**: `buildMealSummary('weekly')` now uses the same last-7-day window as `buildWeeklyDayCards()` instead of the calendar Mon-Sun week

---

## [0.0.1] - 2026-06-03

### Added
- Initial commit
- Scaffolded mess-management micro-frontend and integrated into shell manifest and build scripts
