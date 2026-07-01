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

The frontend is a **Webpack Module Federation remote** (port 4201) that exposes three modules to the KJUsys shell (port 4200). It uses:

- **Standalone components** (Angular 16) with lazy-loaded NgModule wrappers
- **NgRx** for state (via shared auth lib)
- **WebSocket** for real-time tap and hardware-status updates
- **Hash-based routing** (`HashLocationStrategy`)
- **Dynamic backend URL resolution** via `ConfigLoaderService` (supports dev-mode GitHub gist override, local storage cache, and server probing)

**Build order dependencies:** Shared libraries (`@libs/*`) must be compiled to `dist/libs/` before the app builds.

---

## Modules & Features

### 1. Dashboard Module (`/kjusys/dashboard`)

| Feature | Component | Description |
|---|---|---|
| **Stats Overview** | `StatsBarComponent` | 4 stat cards: Total Subscribers, Active Subscriptions, Total Meals Served Today, Absent Today |
| **Meal Slot Status** | `MealSlotsComponent` | Live/Upcoming/Closed meal slots with animated counters, real-time updates via WebSocket |
| **Configure Meal Slots** | `ConfigureMealSlotsComponent` | Modal with 3 sub-tabs: |
| | | **Meal Slots** — Add/edit/delete meal schedules with time pickers, overlap validation |
| | | **Display Panel** — LCD message templates per tap scenario with variable substitution (`"name"`, `"rollno"`, `"meal"`, `"status"`) and device test |
| | | **Token Customization** — Receipt/token layout configuration with printer test |
| **Recent Tap Activity** | `EntriesTableComponent` | Table of recent RFID taps (Subscriber, Roll Number, Meal Slot, Time, Status) |
| **Hardware Status** | `HardwareStatusComponent` | Device list with online/offline indicators, uptime bar, response time, last sync |
| **Hardware Settings** | `HardwareSettingsModalComponent` | Full device lifecycle: list, pair (2-min window), confirm, test peripherals (LCD/Printer/Buzzer/Relay), rename, delete, rotate HMAC secret, emergency stop |

### 2. Subscriber Management Module (`/kjusys/subscriber-management`)

| Feature | Component | Description |
|---|---|---|
| **Subscriber Stats** | `SubscriberStatsComponent` | Total, Active, Paused, Lapsed counts |
| **Subscriber Table** | `SubscriberTableComponent` | Paginated, searchable, filterable table with columns: Subscriber, Roll Number, Meal Plan, Status (colored badge), Joined Date (with expiry warning for subscribers expiring within 7 days). Custom filter panel with checkbox selections for meal slots and status, plus radio selection for expiry range (7/15/30 days). Export to CSV. |
| **Add Subscriber** | `AddSubscriberModalComponent` | Form with name, email, roll number, meal slot multi-select, start/end dates, status dropdown, pause start/end dates, pause reason |
| **Edit Subscriber** | `EditSubscriberModalComponent` | Pre-populated form for editing existing subscribers |
| **Subscriber Form** | `SubscriberFormComponent` | Reusable form with custom-built date pickers, validation, conditional pause start/end date fields, pause reason input |
| **ID Card Preview** | `SubscriberCardPreviewComponent` | Front/back card design with Mess Pass branding, roll number, terms & conditions |
| **Card Modal** | `SubscriberCardModalComponent` | Post-creation preview of subscriber's ID card |
| **Student Detail** | `StudentDetailComponent` | Full student profile: overview cards (plan, status, card, attendance), subscription history with timeline, tap activity log, change log, and pause compensation card showing taps-during-pause with conditional styling. Accessed inline via the table "View" action or deep-linked from the quick modal with `?student=X` query param. |

### 3. Reports Module (`/kjusys/reports`)

| Feature | Component | Description |
|---|---|---|
| **Analytics Dashboard** | `AnalyticsDashboardComponent` | Daily overview with total taps, active/paused/expired subscriber counts, and meal distribution bread chart showing real tap-to-subscriber ratios per meal slot. Optional date range filter queries historical tap data. |
| **Holiday Calendar** | `HolidayCalendarComponent` | Calendar view of mess holidays fetched from backend, with date formatting via Angular `date` pipe. |
| **Audit Tools** | `AuditToolsComponent` | Three sub-tabs: **Pause Audit** — table of paused subscriptions showing tap activity during pause periods; **Anomalies** — irregular tap events (blocked card taps, unsubscribed meal taps); **Change Log** — subscription modification history. |
| **Quick Modal** | `QuickModalComponent` | Shared floating-action-button modal for quick student lookup from any page. Uses `Router.navigate()` with queryParams, fetches and displays student overview (name, roll, plan, status, card, attendance, date range).

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
| GET | `/students?search=&page=&size=&plan=&status=` | `SubscriberService` | Paginated subscriber list with filters |
| GET | `/students/expiring` | `SubscriberService` | Subscribers expiring soon |
| GET | `/students/lookup/:roll_number` | `SubscriberService` | Quick lookup for registration flow |
| GET | `/students/:roll_number` | `SubscriberService` | Single subscriber by roll number |
| POST | `/students` | `SubscriberService` | Create new subscriber. Body: supports `pauseReason`, `pauseStart_Date`, `pauseEnd_Date`. |
| PUT | `/students/:roll_number` | `SubscriberService` | Update subscriber. Merges subscription fields; extends `end_Date` by pause duration when resuming from pause. Body: supports `pauseReason`, `pauseStart_Date`, `pauseEnd_Date`. |
| DELETE | `/students/:roll_number` | `SubscriberService` | Delete subscriber |
| POST | `/students/:roll_number/renew` | `SubscriberService` | Renew subscription |
| POST | `/students/:roll_number/pause` | `SubscriberService` | Pause subscription |

### Schedule (Meal Slots)

| Method | Endpoint | Service | Purpose |
|---|---|---|---|
| GET | `/schedule` | `MealSlotService` / `DashboardService` | All meal schedules |
| GET | `/schedule/today` | `DashboardService` | Today's schedule with day type |
| POST | `/schedule` | `MealSlotService` / `DashboardService` | Create meal schedule |
| PUT | `/schedule/:id` | `MealSlotService` / `DashboardService` | Update meal schedule |
| DELETE | `/schedule/:id` | `MealSlotService` / `DashboardService` | Delete meal schedule |
| POST | `/schedule/holiday` | — | Mark holiday (not yet wired in UI) |

### Taps

| Method | Endpoint | Service | Purpose |
|---|---|---|---|
| GET | `/taps?meal=` | `DashboardService` | Today's tap entries |

### Hardware Status & Management

| Method | Endpoint | Service | Purpose |
|---|---|---|---|
| GET | `/hardware-status` | `DashboardService` | Devices status + server stats |
| GET | `/hardware` | `HardwareManagementService` | List all devices |
| GET | `/hardware/:id` | `HardwareManagementService` | Single device |
| POST | `/hardware` | `HardwareManagementService` | Register device |
| PUT | `/hardware/:id` | `HardwareManagementService` | Update device |
| DELETE | `/hardware/:id` | `HardwareManagementService` | Delete device |
| POST | `/hardware/start-pairing` | `HardwareManagementService` | Open pairing window |
| POST | `/hardware/pair` | `HardwareManagementService` | Pair device by MAC + code |
| POST | `/hardware/:id/confirm` | `HardwareManagementService` | Confirm/activate device |
| POST | `/hardware/:id/test-printer` | `HardwareManagementService` | Test printer |
| POST | `/hardware/:id/test-display` | `HardwareManagementService` | Test LCD display |
| POST | `/hardware/:id/rotate-secret` | `HardwareManagementService` | Rotate HMAC secret |
| POST | `/hardware/:id/stop` | `HardwareManagementService` | Emergency stop |
| POST | `/hardware/:id/heartbeat` | — | Device heartbeat (device → server) |

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
| GET | `/reports/analytics?from=&to=` | `ReportsService` | Analytics aggregate: total taps, active/paused/expired subscriber counts, meal distribution with tapCount/subscriberCount per slot. Optional date range filters tap data; subscriber counts are current snapshot. |
| GET | `/reports/holidays` | `ReportsService` | All mess holiday records |
| GET | `/reports/students?search=` | `ReportsService` | Search students by roll number or name (regex), returns student list with subscription status and raw document data |
| GET | `/reports/students/:rollNumber/overview` | `ReportsService` | Single student overview: profile, subscription details, card status, total taps, attendance rate |
| GET | `/reports/students/:rollNumber/taps?meal=&from=&to=` | `ReportsService` | Student tap history with optional meal/date filters |
| GET | `/reports/students/:rollNumber/attendance` | `ReportsService` | Student attendance summary per meal slot |
| GET | `/reports/students/:rollNumber/changelog` | `ReportsService` | Subscription modification history for a student |
| GET | `/reports/students/:rollNumber/history` | `ReportsService` | Complete subscription history records |
| GET | `/reports/pause-audit` | `ReportsService` | Pause audit: all paused subscriptions with tapsDuringPause count and compensatedDays |
| GET | `/reports/anomalies` | `ReportsService` | Irregular tap events: blocked-card taps, unsubscribed-meal taps, lapsed-student taps |
| GET | `/reports/changelog` | `ReportsService` | Global change log across all subscriptions |
| GET | `/reports/exports` | — | List export records |
| GET | `/reports/exports/:date` | — | Download export Excel file by date |
| POST | `/reports/export/trigger` | — | Manual export trigger |

---

## Shared Services

| Service | Location | Purpose |
|---|---|---|
| `DashboardService` | `modules/dashboard/services/` | Fetches schedules, taps, hardware status, display configs |
| `SubscriberService` | `modules/subscriber-management/services/` | Full subscriber CRUD with backend mapping |
| `MealSlotService` | `shared/services/` | Cached meal slot CRUD with `BehaviorSubject` + 5-min stale time |
| `SubscriberFormService` | `shared/services/` | Form validation, date parsing (DD/MM/YY ↔ timestamp), meal plan ↔ codes mapping, pause start/end date and pause reason validation |
| `HardwareManagementService` | `shared/services/` | All hardware lifecycle operations |
| `WebsocketService` | `shared/services/` | Raw WebSocket connection with auto-reconnect |
| `ConnectionMonitorService` | `shared/services/` | Server health polling, server-down alerts with retry |
| `ConfigLoaderService` | `environments/` | Dynamic backend URL resolution at bootstrap: applies cached/localhost URL immediately, then fetches GitHub Gist asynchronously in background and probes server |
| `NetworkService` | `shared/services/` | Browser online/offline monitoring with Wi-Fi alerts |
| `NetworkInterceptor` | `shared/services/` | HTTP interceptor: detects 502-504/status 0 as server-down |
| `ReportsService` | `modules/reports/services/` | All reports API calls: student search/overview/taps/attendance/changelog/history, analytics dashboard, holidays, pause audit, anomalies, global changelog. Maps backend snake_case responses to camelCase models and performs nested array extraction. |

---

## WebSocket Events

Connection to `ws://{host}/kjusys-api/mess-management/ws`

| Event | Direction | Payload | Component Reaction |
|---|---|---|---|
| `tap.new` | Server → Client | `{ event: "tap.new", data: { ... } }` | Dashboard: live-update meal slot counts, add row to recent entries |
| `tap.duplicate` | Server → Client | `{ event: "tap.duplicate", data: { ... } }` | Dashboard: show duplicate indication |
| `hardware.status` | Server → Client | `{ event: "hardware.status", data: { ... } }` | Dashboard: update device status indicators |
| `connected` | Server → Client | `{ event: "connected", message: "..." }` | WebSocketService: confirm connection |
| `get.hardware.status` | Client → Server | `{ event: "get.hardware.status" }` | Sent on connect to request initial status |

---

## Component Tree

```
AppComponent
├── NavigationComponent (router-outlet shell)
│   ├── [Route: /kjusys/dashboard]
│   │   └── DashboardComponent
│   │       ├── StatsBarComponent (4 stat cards)
│   │       ├── MealSlotsComponent (live slot grid)
│   │       │   └── ConfigureMealSlotsComponent (modal)
│   │       ├── EntriesTableComponent (recent taps)
│   │       ├── HardwareStatusComponent (devices + server stats)
│   │       │   └── HardwareSettingsModalComponent (full device mgmt)
│   │       └── lib-tabs (Dashboard / Subscriber Management / Reports)
│   │
│   ├── [Route: /kjusys/subscriber-management]
│   │   └── SubscriberManagementComponent
│   │       ├── SubscriberStatsComponent (counts)
│   │       ├── SubscriberTableComponent (table + filters + pagination)
│   │       │   └── StudentDetailComponent (inline when "View" is clicked)
│   │       ├── AddSubscriberModalComponent
│   │       │   └── SubscriberFormComponent
│   │       ├── EditSubscriberModalComponent
│   │       │   └── SubscriberFormComponent
│   │       ├── SubscriberCardPreviewComponent
│   │       └── SubscriberCardModalComponent
│   │
│   └── [Route: /kjusys/reports]
│       └── ReportsComponent
│           ├── AnalyticsDashboardComponent (sub-tab: analytics)
│           ├── HolidayCalendarComponent (sub-tab: holidays)
│           └── AuditToolsComponent (sub-tab: audit)
│               ├── Pause Audit (sub-sub-tab: pause-audit)
│               ├── Anomalies (sub-sub-tab: anomalies)
│               └── Change Log (sub-sub-tab: changelog)
│
└── [Global]
    └── QuickModalComponent (floating action button + modal)
```

---

## MFE Manifest (Exposed Modules)

Exposed in `webpack.config.js` and registered in `mf.manifest.json`:

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
| `/kjusys/reports` | `ReportsModule` (lazy) | `ReportsComponent` (sub-tabs: analytics, audit, holidays) |
| Deep-link via `?student=<rollNumber>` query param | SubscriberManagementModule | Opens `StudentDetailComponent` inline from any route |

---

## Shared Libraries Used

| Library | Import Path | Components/Services Used |
|---|---|---|
| `shared-auth` | `@libs/shared-auth` | `SharedAuthComponent`, `SharedToastService` |
| `http-common` | `@libs/http-common` | `HttpCommonService` |
| `shared-ui` | `@libs/shared-ui` | `BreadcrumbsTitleComponent`, `EmptyStateComponent`, `ButtonComponent` |
| `tabs` | `@libs/tabs` | `TabsModule`, `TabItem` |
| `sub-tabs` | `@libs/sub-tabs` | `SubTabsModule`, `SubTabItem` |
| `table` | `@libs/table` | `TableModule`, `TableColumn`, `PaginationConfig` |
| `dropdown-lib` | `@libs/dropdown-lib` | Multi-select dropdown for meal slot/status filters |
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
  status: 'Active' | 'Paused' | 'Lapsed';
  joinedDate: string;
  startDate?: string;     // DD/MM/YY
  endDate?: string;       // DD/MM/YY
  pauseEndDate?: string;  // DD/MM/YY
  pauseStartDate?: string; // DD/MM/YY
  pauseReason?: string;
  expiryWarning?: string;  // "expiry in N days" for active subs within 7 days
  mealNames?: string[];
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

**`ConfigLoaderService`** dynamically resolves the backend URL at bootstrap by checking (in order):
1. Dev mode flag (`localStorage.kjusys_devMode`) — uses `http://localhost:8080` immediately
2. LocalStorage cache (previously resolved URL) — applied immediately, non-blocking
3. GitHub Gist raw URL — fetched asynchronously in background; if a different URL is returned, swaps to it and probes the server
4. Localhost fallback — used if nothing else resolves

---

## Production Servors

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

## Changelog

### 2026-07-02 — Endpoint & CDR cleanup

**Purged endpoints (no frontend UI planned):**
- `GET /settings`, `PUT /settings` — removed entire settings infrastructure (subrouter, handler, service, constants)
- `POST /students/:roll_number/block`, `POST /students/:roll_number/unblock` — removed routes, handlers, constants (may be re-added if card blocking is needed later)
- `DELETE /display-config/:meal` — removed route and handler (display configs managed via PUT only)

**Bug fix:**
- `PUT /students/:roll_number/renew` → `POST` (frontend was sending wrong HTTP method)
- `PUT /students/:roll_number/pause` → `POST` (frontend was sending wrong HTTP method)

**Change detection:**
- Added `ChangeDetectorRef` with `detectChanges()` / `markForCheck()` to:
  - `SubscriberStatsComponent` — `OnPush` strategy + input setter
  - `SubscriberTableComponent`
  - `SubscriberCardModalComponent`
  - `SubscriberCardPreviewComponent`
  - `MealSlotsComponent` (dashboard)
  - `HardwareStatusComponent` (dashboard)
- Parent `SubscriberManagementComponent`: added `cdr.detectChanges()` after background stats fetch to ensure stats cards render
