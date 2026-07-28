# KJUsys Mess Management — Frontend (Angular MFE)

> Built by **Software Development Centre (SDC)** — Kristu Jayanti College (Deemed to be University)

Micro-frontend application for the KJUsys Mess Management System. Built with **Angular 16**, **Webpack Module Federation**, and **TailwindCSS**. Runs as a remote MFE loaded by the KJUsys shell at runtime.

---

## Table of Contents

- [Architecture Overview](#architecture-overview)
- [Modules & Features](#modules--features)
- [API Endpoints Consumed](#api-endpoints-consumed)
- [Shared Services](#shared-services)
- [WebSocket Events](#websocket-events)
- [Component Tree](#component-tree)
- [MFE Manifest (Exposed Modules)](#mfe-manifest-exposed-modules)
- [Route Map](#route-map)
- [Shared Libraries Used](#shared-libraries-used)
- [Data Models](#data-models)
- [Environment Configuration](#environment-configuration)
- [Production Servers](#production-servers)

---

## Architecture Overview

The frontend is a **Webpack Module Federation remote** (port 4201) that exposes three components + one NgModule to the KJUsys shell (port 4200). It uses:

- **Standalone components** (Angular 16) with lazy-loaded NgModule wrappers
- **NgRx** for state (via shared auth lib)
- **WebSocket** for real-time tap and hardware-status updates
- **Hash-based routing** (`HashLocationStrategy`)
- **Dynamic backend URL resolution** via `ConfigLoaderService` (supports dev-mode localStorage override, GitHub gist background fetch, and server probing)
- **Responsive layout** across mobile, tablet, and desktop viewports
- **Skeleton loading screens** for all major async data views

**Build order dependencies:** Shared libraries (`@libs/*`) must be compiled to `dist/libs/` before the app builds.

---

## Modules & Features

### 1. Dashboard Module (`/kjusys/dashboard`)

| Feature | Component | Description |
|---|---|---|
| **Stats Overview** | `StatsBarComponent` | 4 stat cards: Total Subscribers, Active Subscriptions, Total Meals Served Today, Absent Today. Skeleton loading on initial fetch. |
| **Meal Slot Status** | `MealSlotsComponent` | Live/Upcoming/Closed meal slots with animated counters. Status computed from weekday/weekend/holiday schedule. Holiday badge shown for closed slots on holidays. 30-second auto-refresh of slot status. |
| **Configure Meal Slots** | `ConfigureMealSlotsComponent` | Modal with 3 sub-tabs: **Meal Slots** — add/edit/delete meal schedules with time pickers, overlap validation, day-type multi-select (weekday/weekend/holiday); **Display Panel** — LCD message templates with variable substitution and device test; **Token Customization** — receipt/token layout configuration with printer test. |
| **Recent Tap Activity** | `EntriesTableComponent` | Last 24h tap records (Name, Roll Number, Meal Slot, Time, Status). Capped at 15 visible rows. "View all" routes to Reports Dashboard. |
| **Hardware Status** | `HardwareStatusComponent` | Device list with online/offline indicators, peripherals expanded into separate entries, server uptime bar, response time. |
| **Hardware Settings** | `HardwareSettingsModalComponent` | Flat layout (no sub-tabs): "Register New Device" form at top + "Registered Devices" list below. Device lifecycle: register, connect (direct, returns HMAC secret + token), confirm, rename, rotate HMAC secret, delete. Shows HMAC secret + device token after registration/rotation. |
| **Holiday Calendar** | `HolidayCalendarComponent` | Calendar view of mess holidays. Add/delete holidays with inline confirmation modal. Holiday list with accordion grouped by month. |

### 2. Subscriber Management Module (`/kjusys/subscriber-management`)

| Feature | Component | Description |
|---|---|---|
| **Subscriber Stats** | `SubscriberStatsComponent` | Total, Active, Paused, Lapsed, Super User counts. |
| **Subscriber Table** | `SubscriberTableComponent` | Paginated, searchable, filterable table with sticky actions column. Columns: Subscriber, Roll Number, Meal Plan, Status (colored badge), Joined Date (with expiry warning for subs expiring within 7 days). Filters: meal slot multi-select, status multi-select (inc. Super User with purple badge), expiry range (7/15/30 days). Export to CSV. |
| **Add Subscriber** | `AddSubscriberModalComponent` | Form with name, email, roll number, meal slot multi-select (`<lib-dropdown-lib>`), day preference dropdown (All Days / Weekdays Only / Weekends Only), subscription date range (`<lib-date-picker>`), status dropdown, super user checkbox (with warning popup). Pause section: start/end date range + reason. |
| **Edit Subscriber** | `EditSubscriberModalComponent` | Pre-populated form with **Renew section** (shown when near expiry or lapsed): month-based preset pills (1M, 3M, 6M, 1Y) + Cancel/Confirm. Renewals persist `end_Date` from API response. |
| **Subscriber Form** | `SubscriberFormComponent` | Reusable form with `<lib-dropdown-lib>` multi-select for meal slots, `<lib-date-picker>` range pickers, day preference dropdown, super user toggle, conditional pause section. On save, `end_Date` is automatically extended by holiday count within the subscription range. Server-computes `duration_days`. |
| **ID Card Preview** | `SubscriberCardPreviewComponent` | Front/back card design with Mess Pass branding, roll number, terms & conditions. |
| **Card Modal** | `SubscriberCardModalComponent` | Post-creation preview of subscriber's ID card. |
| **Student Detail** | `StudentDetailComponent` | Full student profile with 5-tab layout: **Overview** (plan, status, card, attendance, super user banner), **Attendance** (GitHub-style heatmap with color-coded cells — present/partial/absent/holiday/paused — with day tap drill-down), **Subscription History** (timeline with milestones for CREATED, RENEWED, MODIFIED, PAUSE_STARTED/ENDED/EXTENDED, PAUSE_REQUESTED, PAUSE_AUTO_STARTED), **Activity Log** (changelog with action filter chips), **Compensation / Pause** (pause periods with status badges, compensated days, taps-during-pause). Skeleton loading, error states, empty states. |

### 3. Reports Module (`/kjusys/reports`)

| Feature | Component | Description |
|---|---|---|
| **Analytics Dashboard** | `ReportsDashboardComponent` | KPI cards (meals served, active subscribers, absent, paused, anomalies), meal distribution bread chart, Live Tap Activity table with client pagination. Export Report modal with type selector (Full Report / Tap Activity / Analytics / Audit / Paused), format (CSV/Excel), optional student roll number, and date range. |
| **Audit Tools** | `AuditToolsComponent` | Three sub-tabs: **Pause Audit** — table of paused subscriptions with tap activity during pause; **Anomalies** — irregular tap events (unsubscribed meal taps, lapsed taps); **Change Log** — global subscription modification history with action filter dropdown (includes SCHEDULE_CREATED/MODIFIED/DELETED, TAP_REJECTED, HOLIDAY_DELETED). |
| **Quick Modal** | `QuickModalComponent` | Floating-action-button modal for quick student lookup from any page. Fetches and displays student overview (name, roll, plan, status, card, attendance rate from last 6 months). |

---

## API Endpoints Consumed

All requests are prefixed with the dynamically resolved base URL: `{base}/kjusys-api/mess-management`

### Health

| Method | Endpoint | Service | Purpose |
|---|---|---|---|
| GET | `/health` | `ConnectionMonitorService` | Server health check / ping |

### Students (Subscriber CRUD)

| Method | Endpoint | Service | Purpose |
|---|---|---|---|
| GET | `/students?search=&page=&size=&plan=&status=` | `SubscriberService` | Paginated subscriber list with filters (status supports comma-separated, includes "Super User") |
| GET | `/students/expiring?days=` | `SubscriberService` | Subscribers expiring soon |
| GET | `/students/lookup/:roll_number` | `SubscriberService` | Quick lookup for registration flow |
| GET | `/students/:roll_number` | `SubscriberService` | Single subscriber by roll number |
| POST | `/students` | `SubscriberService` | Create subscriber. Supports `superUser`, `pauseReason`, `pauseStart_Date`, `pauseEnd_Date`, `dayPreference`. |
| PUT | `/students/:roll_number` | `SubscriberService` | Update subscriber. Server-computes `duration_days`. Supports `superUser`, `dayPreference`, pause fields. |
| DELETE | `/students/:roll_number` | `SubscriberService` | Delete subscriber (cascade-cleans orphaned data server-side) |
| POST | `/students/:roll_number/renew` | `SubscriberService` | Renew subscription. Sends month-based presets (1M/3M/6M/1Y). |
| POST | `/students/:roll_number/pause` | `SubscriberService` | Pause subscription |

### Schedule (Meal Slots)

| Method | Endpoint | Service | Purpose |
|---|---|---|---|
| GET | `/schedule` | `MealSlotService` / `DashboardService` | All meal schedules |
| GET | `/schedule/today` | `DashboardService` | Today's schedule with day type |
| POST | `/schedule` | `MealSlotService` / `DashboardService` | Create meal schedule |
| PUT | `/schedule/:id` | `MealSlotService` / `DashboardService` | Update meal schedule |
| DELETE | `/schedule/:id` | `MealSlotService` / `DashboardService` | Delete meal schedule |
| POST | `/schedule/holiday` | `DashboardService` | Create holiday record |
| DELETE | `/schedule/holiday/:id` | `DashboardService` | Delete holiday record |
| GET | `/schedule/holidays` | `DashboardService` | All mess holiday records |

### Taps

| Method | Endpoint | Service | Purpose |
|---|---|---|---|
| GET | `/taps?meal=` | `DashboardService` | Last 24h tap entries (rolling window) |

### Hardware Status & Management

| Method | Endpoint | Service | Purpose |
|---|---|---|---|
| GET | `/hardware-status` | `DashboardService` | Devices status + server stats |
| GET | `/hardware` | `HardwareManagementService` | List all devices |
| POST | `/hardware/connect` | `HardwareManagementService` | Direct connect — registers device in active state with HMAC secret. Returns `{ device, hmacSecret, hmacSecretHash }`. |
| POST | `/hardware` | `HardwareManagementService` | Register device (pending state) |
| GET | `/hardware/:id` | `HardwareManagementService` | Single device |
| PUT | `/hardware/:id` | `HardwareManagementService` | Update device |
| DELETE | `/hardware/:id` | `HardwareManagementService` | Delete device |
| POST | `/hardware/start-pairing` | `HardwareManagementService` | Open pairing window |
| POST | `/hardware/pair` | `HardwareManagementService` | Pair device by MAC + code |
| POST | `/hardware/:id/confirm` | `HardwareManagementService` | Confirm/activate device (generates HMAC secret + hash) |
| POST | `/hardware/heartbeat` | — | Device heartbeat (device → server, rate-limited) |
| POST | `/hardware/:id/rotate-secret` | `HardwareManagementService` | Rotate HMAC secret. Returns `{ newSecret, newSecretHash }`. |

### Display Configuration

| Method | Endpoint | Service | Purpose |
|---|---|---|---|
| GET | `/display-config` | `DashboardService` | All LCD display configs |
| GET | `/display-config/:meal` | `DashboardService` | Display config by meal |
| PUT | `/display-config` | `DashboardService` | Update display config |

### Reports

| Method | Endpoint | Service | Purpose |
|---|---|---|---|
| GET | `/reports/today` | `DashboardService` | Today's meal report with per-meal breakdown |
| GET | `/reports/analytics?from=&to=` | `ReportsService` | Analytics aggregate: total taps, active/paused/expired/absent counts, expected active today (dayPreference-aware), meal distribution with tapCount/subscriberCount per slot |
| GET | `/reports/pause-audit` | `ReportsService` | Pause audit: all paused subscriptions with tapsDuringPause and compensatedDays |
| GET | `/reports/anomalies` | `ReportsService` | Irregular tap events: unsubscribed-meal taps, lapsed-student taps |
| GET | `/reports/exports` | — | List export records |
| GET | `/reports/exports/:date` | — | Download export Excel file by date |
| POST | `/reports/export/trigger` | `ReportsService` | Trigger export with filters (type, format, mealSlots, statuses, rollNumbers, date range). Returns file directly. |
| GET | `/students/:roll_number/taps` | `ReportsService` | Student tap history (defaults to last 30 days) |
| GET | `/students/:roll_number/attendance` | `ReportsService` | Student attendance summary per meal slot |
| GET | `/students/:roll_number/changelog` | `ReportsService` | Subscription modification history for a student |
| GET | `/students/:roll_number/pause-comp` | `ReportsService` | Pause compensation: pause window, status, taps-during-pause, compensated days |
| GET | `/students/:roll_number/subscription-history` | `ReportsService` | Complete subscription history records |
| GET | `/changelog` | `ReportsService` | Global change log (up to 500 entries, client-side filtered by roll number, action, date range) |

---

## Shared Services

| Service | Location | Purpose |
|---|---|---|
| `DashboardService` | `modules/dashboard/services/` | Fetches schedules, taps, hardware status, display configs, holidays |
| `SubscriberService` | `modules/subscriber-management/services/` | Full subscriber CRUD with backend mapping. Fetches holidays to extend subscription duration (holiday countdown skip). Sends `dayPreference`, `superUser`, pause fields in payload. Contains `countEligibleDays()` for client-side day-preference-aware day counting. |
| `MealSlotService` | `shared/services/` | Cached meal slot CRUD with `BehaviorSubject` + 5-min stale time. Day-type-aware schedule selection. |
| `SubscriberFormService` | `shared/services/` | Form validation, date parsing (DD/MM/YY ↔ timestamp), meal plan ↔ codes mapping, pause start/end date and pause reason validation. Manages `selectedMeals: string[]`, `dayPreference`, `superUser` on form value. |
| `HardwareManagementService` | `shared/services/` | All hardware lifecycle operations: register, connect, pair, confirm, heartbeat, rotate-secret |
| `WebsocketService` | `shared/services/` | Raw WebSocket connection with auto-reconnect |
| `ConnectionMonitorService` | `shared/services/` | Server health polling, server-down alerts with retry |
| `ConfigLoaderService` | `environments/` | Dynamic backend URL resolution at bootstrap: applies cached/localhost URL immediately, fetches GitHub Gist in background and probes server |
| `NetworkService` | `shared/services/` | Browser online/offline monitoring with Wi-Fi alerts |
| `NetworkInterceptor` | `shared/services/` | HTTP interceptor: detects 502-504/status 0 as server-down |
| `ReportsService` | `modules/reports/services/` | All reports API calls: student taps/attendance/changelog/history/pause-comp, analytics dashboard, holidays, pause audit, anomalies, global changelog. Maps backend snake_case to camelCase, performs nested array extraction, client-side changelog filtering. |

---

## WebSocket Events

Connection to `ws://{host}/kjusys-api/mess-management/ws`

| Event | Direction | Payload | Component Reaction |
|---|---|---|---|
| `connected` | Server → Client | `{ event: "connected", message: "..." }` | WebSocketService: confirm connection |
| `tap.new` | Server → Client | `{ event: "tap.new", data: { roll_number, name, meal, time, token, ... } }` | Dashboard: live-update meal slot counts, add row to recent entries |
| `hardware.status` | Server → Client | `{ event: "hardware.status", data: { hardware: [...], serverUptimeSeconds, responseTimeMs } }` | Dashboard: update device status indicators (every 30s) |
| `hardware.device-discovered` | Server → Client | `{ event: "hardware.device-discovered", data: { deviceId, name, macAddress } }` | Hardware settings: show newly paired device |

| Event | Direction | Data | Purpose |
|---|---|---|---|
| `get.hardware.status` | Client → Server | `{ event: "get.hardware.status" }` | Sent on connect to request initial status |

---

## Component Tree

```
AppComponent
├── NavigationComponent (router-outlet shell)
│   ├── [Route: /kjusys/dashboard]
│   │   └── DashboardComponent
│   │       ├── StatsBarComponent (4 stat cards, skeleton loading)
│   │       ├── MealSlotsComponent (live slot grid, 1-4 cols, 30s auto-refresh)
│   │       │   └── ConfigureMealSlotsComponent (modal: meal slots / display / token)
│   │       ├── EntriesTableComponent (recent taps, 15-row cap)
│   │       ├── HardwareStatusComponent (devices + peripherals + server stats)
│   │       │   └── HardwareSettingsModalComponent (flat layout: register + device list)
│   │       ├── HolidayCalendarComponent (calendar + accordion)
│   │       └── lib-tabs (Dashboard / Subscriber Management / Reports)
│   │
│   ├── [Route: /kjusys/subscriber-management]
│   │   └── SubscriberManagementComponent
│   │       ├── SubscriberStatsComponent (counts)
│   │       ├── SubscriberTableComponent (table + filters + pagination, sticky actions)
│   │       │   └── StudentDetailComponent (inline when "View" is clicked)
│   │       │       ├── [Tab] Overview (stats, super user banner, detail grid)
│   │       │       ├── [Tab] Attendance (heatmap, per-day drill-down)
│   │       │       ├── [Tab] Subscription History (timeline milestones)
│   │       │       ├── [Tab] Activity Log (changelog, filter chips)
│   │       │       └── [Tab] Compensation / Pause (pause periods, comp details)
│   │       ├── AddSubscriberModalComponent
│   │       │   └── SubscriberFormComponent (lib-dropdown-lib, lib-date-picker)
│   │       ├── EditSubscriberModalComponent
│   │       │   └── SubscriberFormComponent (renew section with month presets)
│   │       ├── SubscriberCardPreviewComponent
│   │       └── SubscriberCardModalComponent
│   │
│   └── [Route: /kjusys/reports]
│       └── ReportsComponent
│           ├── ReportsDashboardComponent (KPI cards + tap table + export modal)
│           └── AuditToolsComponent (sub-tabs: pause-audit, anomalies, changelog)
│               ├── Pause Audit (sub-sub-tab: pause-audit)
│               ├── Anomalies (sub-sub-tab: anomalies)
│               └── Change Log (sub-sub-tab: changelog, client-side filtered)
│
└── [Global]
    └── QuickModalComponent (floating action button + modal)
```

---

## MFE Manifest (Exposed Modules)

Exposed in `webpack.config.js` and `webpack.prod.config.js`:

| Exposed Module | Angular Artifact | Route Path |
|---|---|---|
| `./App` | `AppComponent` (bootstrap) | — |
| `./Dashboard` | `DashboardComponent` | `mess-management/dashboard` |
| `./SubscriberManagement` | `SubscriberManagementComponent` | `mess-management/subscriber-management` |
| `./ReportsModule` | `ReportsModule` (NgModule) | `mess-management/reports` |

---

## Route Map

| URL Path | Module | Component |
|---|---|---|
| `/` | — | Redirects to `/login` |
| `/login` | `SharedAuthComponent` (from `@libs/shared-auth`) | Login page |
| `/kjusys/dashboard` | `DashboardModule` (lazy) | `DashboardComponent` |
| `/kjusys/subscriber-management` | `SubscriberManagementModule` (lazy) | `SubscriberManagementComponent` |
| `/kjusys/reports` | `ReportsModule` (lazy) | `ReportsComponent` (sub-tabs: analytics, audit) |
| Deep-link via `?student=<rollNumber>` query param | SubscriberManagementModule | Opens `StudentDetailComponent` inline from any route |

---

## Shared Libraries Used

| Library | Import Path | Components/Services Used |
|---|---|---|
| `shared-auth` | `@libs/shared-auth` | `SharedAuthComponent`, `SharedToastService` |
| `http-common` | `@libs/http-common` | `HttpCommonService` |
| `shared-ui` | `@libs/shared-ui` | `BreadcrumbsTitleComponent`, `EmptyStateComponent`, `ButtonComponent` |
| `shared-toast` | `@libs/shared-toast` | Toast notifications for renew success, errors |
| `tabs` | `@libs/tabs` | `TabsModule`, `TabItem` |
| `sub-tabs` | `@libs/sub-tabs` | `SubTabsModule`, `SubTabItem` |
| `table` | `@libs/table` | `TableModule`, `TableColumn`, `PaginationConfig` |
| `dropdown-lib` | `@libs/dropdown-lib` | Multi-select dropdown for meal slot/status filters |
| `date-picker` | `@libs/date-picker` | Range date pickers for subscription and pause dates |
| `alert` | `@libs/alert` | `AlertService` for connection alerts |
| `left-menu-lib` | `@libs/left-menu-lib` | Sidebar navigation |
| `menu-header-lib` | `@libs/menu-header-lib` | Top header bar |

**Note:** Auth is bypassed — `AuthGuard` in `shared-auth` unconditionally returns `true` for development.

---

## Data Models

```typescript
// Shared models (shared/models/)

interface MealEntry {
  customer: string;
  roll_number: string;
  mealSlot: 'Breakfast' | 'Lunch' | 'Dinner';
  time: string;
  status: 'Allowed' | 'Not Subscribed';
}

interface MealSlot {
  name: string;
  code: string;
  icon: string;
  status: 'Closed' | 'Live' | 'Upcoming';
  timeRange: string;
  total: number;
  hadMeal: number | null;
  thirdStat: number | null;
  thirdLabel: string;
  startTime?: string;
}

interface HardwareDevice {
  deviceId: string;
  name: string;
  icon: string;
  status: 'Online' | 'Connected' | 'Low Paper' | 'Offline';
  lastSeenMs?: number;
}

interface DashboardStat {
  label: string;
  value: number;
  icon: string;
  color: string;
}

interface Subscriber {
  id: string | number;
  name: string;
  email: string;
  roll_number: string;
  mealPlan: string;       // e.g. "Breakfast+Lunch+Dinner"
  status: string;         // 'Active' | 'Paused' | 'Lapsed' | 'Super User'
  joinedDate: string;
  startDate?: string;     // DD/MM/YY
  endDate?: string;       // DD/MM/YY
  pauseEndDate?: string;  // DD/MM/YY
  pauseStartDate?: string; // DD/MM/YY
  pauseReason?: string;
  expiryWarning?: string;  // "expiry in N days" for active subs within 7 days
  mealNames?: string[];
  dayPreference?: string;  // 'all' | 'weekday' | 'weekend'
  superUser?: boolean;
}
```

---

## Environment Configuration

Six environment variants in `projects/mess-management/src/environments/`:

| File | `production` | Backend URL |
|---|---|---|
| `environment.ts` | `false` | `http://localhost:8080/kjusys-api/mess-management` |
| `environment.prod.ts` | `true` | `https://kjusys.kristujayanti.edu.in/kjusys-api` |
| `environment.dev.ts` | `true` | `http://dev-kjusys.kristujayanti.edu.in/kjusys-api` |
| `environment.local.ts` | `true` | Local override |
| `environment.demo.ts` | `true` | Demo server |
| `environment.local-server.ts` | `true` | Local server |

**`ConfigLoaderService`** dynamically resolves the backend URL at bootstrap:
1. Dev mode flag (`localStorage.kjusys_devMode`) — uses `http://localhost:8080` immediately
2. LocalStorage cache (previously resolved URL) — applied immediately, non-blocking
3. GitHub Gist raw URL — fetched asynchronously in background; if different, swaps and probes
4. Localhost fallback — used if nothing else resolves

---

## Production Servers

Located in `prod-server/`:

| File | Port | Description |
|---|---|---|
| `shell.js` | 4200 | Express server for shell app (gzip, smart caching) |
| `mess-management.js` | 4201 | Express server for mess-management remote static files |
| `server.js` | 4300 | Standalone Express server (alternative) |

---

## CLI Scaffolding

| Command | Purpose |
|---|---|
| `npm run create:project -- --name <name> --port <port>` | Bootstrap new MFE remote project |
| `npm run create:module -- --project <name> --module <name>` | Add sub-module to existing remote |
| `npm run build:lib` | Build all shared libraries (3-stage parallel) |
| `npm run build` | Build shell + mess-management |
| `npm run serve` | Dev servers (shell:4200, mess:4201) concurrently |
| `npm run start` | Production Express servers |

---

For the full changelog, see [CHANGELOG.md](./CHANGELOG.md).
