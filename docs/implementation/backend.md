# Implementation Plan: Backend Additions for Real-Time Display, Alerts, and Notifications

## Overview

This document specifies the implementation plan for the backend additions required by the KJU Mess Management System to support the features described in `docs/specs/2026-07-20-real-time-alerts-notifications.md`. The backend is a Vert.x 4.5 application using a MongoDB sync driver.

### Architectural Decision: Synchronous Processing Within Vert.x Event Loop

A critical architectural decision has been made regarding the implementation of these new features.

**Rejected Approach: Native Vert.x Reactive (`Future` / `Promise` / `MongoClient` reactive API)**

The project's current backend codebase (`KJUsys-MessManagement-Backend`) does not utilize the native Vert.x `MongoClient` (which returns `Future<T>`). Instead, it uses the **MongoDB Sync Driver** directly, initialized in `MongoConfig.java` and accessed via `MongoDataAccess`.

Because the entire data access layer is built on blocking synchronous calls, attempting to retrofit the existing code with reactive patterns would require:
1. Refactoring `MongoDataAccess` and all services to use the Vert.x `MongoClient`.
2. Modifying all existing endpoints to handle `Future<T>` return types.
3. Ensuring thread-safety across all existing database operations.

This approach introduces a high risk of regression and is not feasible for the current scope.

**Selected Approach: Blocking Calls on Dedicated Worker Verticles**

To accommodate the existing synchronous MongoDB driver while still leveraging Vert.x's concurrency model, we will execute blocking database and notification operations on dedicated worker verticles.

*   **Main Event Loop (`MainVerticle`):** Continues to handle HTTP requests and non-blocking logic.
*   **Worker Verticles:** We will deploy specific worker verticles for heavy/blocking tasks:
    *   `AlertProcessorVerticle`: Consumes from the `alert.processor` address, queries MongoDB for alert rules, and persists notifications.
    *   `NotificationDispatcherVerticle`: Consumes from the `notification.dispatcher` address, queries MongoDB for subscriber contacts, and sends emails via SMTP.
*   **Event Bus:** The `MainVerticle` will publish messages to the Event Bus (`alert.processor`). The worker verticles will consume these messages, perform the blocking work, and optionally send results to other Event Bus addresses (e.g., `notification.dispatcher`).
*   **Thread Safety:** By isolating blocking calls to dedicated worker verticles (or using `vertx.executeBlocking`), we prevent blocking the main event loop and ensure that concurrent requests do not cause race conditions on shared database connections.

This approach allows us to add the new features with minimal disruption to the existing codebase.

---

## New Files to Create

### 1. Verticle: `AlertProcessorVerticle.java`

**Location:** `src/main/java/in/edu/kristujayanti/verticles/AlertProcessorVerticle.java`

**Responsibility:**
*   Listens on the `alert.processor` Event Bus address.
*   Queries the `alerts` collection to find all enabled rules matching the incoming event type (e.g., `low_stock`, `anomaly`).
*   For each matching rule, creates a notification record in the `notifications` collection.
*   Publishes the new notification to the `notification.dispatcher` address.

**Key Dependencies:**
*   `MongoDataAccess` (or direct `MongoDatabase` access)
*   `EventBus`

**Logic:**
1.  Receive message (JSON) on `alert.processor`.
2.  Parse event type (e.g., `"low_stock"`).
3.  Query `alerts` collection: `find({ enabled: true, eventType: eventType })`.
4.  For each rule found:
    *   Construct notification payload (rule title, message template, severity).
    *   Insert into `notifications` collection (status: `PENDING`).
    *   Publish to `notification.dispatcher`.
5.  Acknowledge message.

### 2. Verticle: `NotificationDispatcherVerticle.java`

**Location:** `src/main/java/in/edu/kristujayanti/verticles/NotificationDispatcherVerticle.java`

**Responsibility:**
*   Listens on the `notification.dispatcher` Event Bus address.
*   Queries the `subscribers` collection to find users subscribed to the notification's category (or all users if broadcast).
*   Sends emails using JavaMailSender (SMTP).

**Key Dependencies:**
*   `MongoDataAccess` (or direct `MongoDatabase` access)
*   `JavaMailSender` (configured via `NotificationService` or a dedicated mail utility)
*   `EventBus`

**Logic:**
1.  Receive notification payload on `notification.dispatcher`.
2.  Query `subscribers` collection: `find({ subscribedCategories: notification.category })` OR `find({})` for broadcast.
3.  For each subscriber:
    *   Personalize email content.
    *   Call `JavaMailSender.send()`.
    *   (Optional) Update notification status to `SENT` or log delivery.
4.  Acknowledge message.

### 3. Service: `NotificationService.java`

**Location:** `src/main/java/in/edu/kristujayanti/services/NotificationService.java`

**Responsibility:**
*   Provides methods to manage notifications (CRUD) and alert rules.
*   Used by `NotificationSubRouter` for HTTP endpoints.

**Key Methods:**
*   `getNotifications(String status, int page, int limit)`: Retrieves paginated notifications from `notifications` collection.
*   `createAlertRule(Document rule)`: Inserts a new rule into `alerts` collection.
*   `updateAlertRule(String id, Document rule)`: Updates an existing rule in `alerts` collection.
*   `deleteAlertRule(String id)`: Deletes a rule from `alerts` collection.
*   `getAlertRules()`: Retrieves all alert rules.

**Data Access:**
*   Uses `MongoDataAccess` to interact with `notifications` and `alerts` collections.

### 4. Router: `NotificationSubRouter.java`

**Location:** `src/main/java/in/edu/kristujayanti/router/subrouter/NotificationSubRouter.java`

**Responsibility:**
*   Defines HTTP endpoints for managing notifications and alert rules.

**Endpoints:**
*   `GET /notifications`: List notifications (with pagination/filtering).
*   `POST /notifications`: Create a manual notification (optional, for admin use).
*   `PUT /notifications/:id`: Update notification status (e.g., mark as read).
*   `DELETE /notifications/:id`: Delete a notification.

*   `GET /alerts/rules`: List alert rules.
*   `POST /alerts/rules`: Create a new alert rule.
*   `PUT /alerts/rules/:id`: Update an alert rule.
*   `DELETE /alerts/rules/:id`: Delete an alert rule.

### 5. Constants: `EventBusAddresses.java` (Optional but Recommended)

**Location:** `src/main/java/in/edu/kristujayanti/constants/EventBusAddresses.java`

**Responsibility:**
*   Centralizes Event Bus address strings to avoid typos.

```java
package in.edu.kristujayanti.constants;

public final class EventBusAddresses {
    public static final String ALERT_PROCESSOR = "alert.processor";
    public static final String NOTIFICATION_DISPATCHER = "notification.dispatcher";

    private EventBusAddresses() {}
}
```

---

## Modifications to Existing Files

### 1. `MainVerticle.java`

**Location:** `src/main/java/in/edu/kristujayanti/MainVerticle.java`

**Changes:**
*   **Deploy Worker Verticles:** In the `start()` method (or after HTTP server initialization), deploy `AlertProcessorVerticle` and `NotificationDispatcherVerticle` as worker verticles.
    ```java
    // Example deployment
    vertx.deployVerticle(new AlertProcessorVerticle(mongoDatabase), new DeploymentOptions().setWorker(true));
    vertx.deployVerticle(new NotificationDispatcherVerticle(mongoDatabase), new DeploymentOptions().setWorker(true));
    ```
*   **Register New SubRouter:** Add `NotificationSubRouter` to the main router chain.
    ```java
    NotificationSubRouter notificationSubRouter = new NotificationSubRouter(mongoDatabase);
    mainRouter.mountSubRouter("/kjusys-api/mess-management", notificationSubRouter.getSubRouter());
    ```

### 2. `EventEmitterService.java`

**Location:** `src/main/java/in/edu/kristujayanti/services/EventEmitterService.java`

**Changes:**
*   **Publish to Event Bus:** After emitting to the local `SharedWorker`, publish the event to the `alert.processor` address on the main Vert.x Event Bus.
    *   This requires injecting the `Vertx` instance into `EventEmitterService` (or accessing it via a static holder/context).
    *   Alternatively, the `MainVerticle` can listen to the `SharedWorker` and then publish to the Event Bus, but injecting `Vertx` is cleaner.

    *Implementation Detail:*
    *   Add a `Vertx` field to `EventEmitterService`.
    *   Modify constructor to accept `Vertx`.
    *   In `emit()`, after `sharedWorker.send(eventData)`:
        ```java
        if (vertx != null) {
            vertx.eventBus().send("alert.processor", eventData);
        }
        ```

### 3. `MongoConfig.java` (No changes expected, but verify)

*   Ensure the `MongoDatabase` instance is accessible to the new verticles. Currently, it is created in `MongoConfig` and passed to `MainVerticle`. We will pass it further to the new verticles.

---

## Implementation Steps

1.  **Create `EventBusAddresses.java`**: Define constants for `ALERT_PROCESSOR` and `NOTIFICATION_DISPATCHER`.
2.  **Create `NotificationService.java`**: Implement CRUD for notifications and alert rules.
3.  **Create `NotificationSubRouter.java`**: Implement HTTP endpoints for notifications and alerts.
4.  **Create `AlertProcessorVerticle.java`**: Implement the logic to process events and create notifications.
5.  **Create `NotificationDispatcherVerticle.java`**: Implement the logic to send emails.
6.  **Modify `EventEmitterService.java`**: Inject `Vertx` and publish events to the Event Bus.
7.  **Modify `MainVerticle.java`**: Deploy worker verticles and register the new subrouter.
8.  **Testing**:
    *   Unit tests for `NotificationService`.
    *   Integration tests for `NotificationSubRouter`.
    *   Manual testing of the full flow: `EventEmitter` -> `AlertProcessor` -> `NotificationDispatcher` -> Email.

---

## Data Models (MongoDB Schemas)

### `notifications` Collection

```json
{
  "_id": ObjectId,
  "title": String,
  "message": String,
  "category": String, // e.g., "low_stock", "anomaly", "system"
  "severity": String, // "info", "warning", "critical"
  "status": String,   // "PENDING", "SENT", "FAILED", "READ"
  "createdAt": ISODate,
  "updatedAt": ISODate,
  "sentAt": ISODate | null,
  "recipients": [String] // Optional: list of email addresses if sent
}
```

### `alerts` Collection (Rules)

```json
{
  "_id": ObjectId,
  "name": String,
  "eventType": String, // "low_stock", "anomaly", "tap_failure"
  "condition": { // Optional: for more complex rules
    "threshold": Number,
    "operator": "gt" | "lt" | "eq"
  },
  "enabled": Boolean,
  "createdAt": ISODate,
  "updatedAt": ISODate
}
```

### `subscribers` Collection (Assumed existing or new)

If subscribers are distinct from `students`, we need a `subscribers` collection. If `students` have an email and notification preferences, we can use that.

*Assumption:* We will use the existing `students` collection and add fields for email and notification preferences if not present. Or, we assume a `subscribers` collection exists for email recipients.

*Decision:* Let's assume a `subscribers` collection for email recipients, as students might not be the only ones receiving alerts (e.g., admins, staff).

**`subscribers` Collection**

```json
{
  "_id": ObjectId,
  "email": String,
  "name": String,
  "subscribedCategories": [String], // ["low_stock", "anomaly", "system"]
  "active": Boolean,
  "createdAt": ISODate
}
```

---

## Configuration

*   **SMTP Settings:** The `NotificationDispatcherVerticle` requires SMTP configuration (host, port, username, password). This should be added to `config.json` or environment variables.
*   **Event Bus Configuration:** Default Vert.x event bus settings are sufficient for single-node deployment. For clustering, additional configuration is needed.

---

## Risk Assessment

*   **Blocking Calls:** Using worker verticles mitigates the risk of blocking the main event loop.
*   **Email Delivery Failures:** The `NotificationDispatcherVerticle` should handle exceptions gracefully, log errors, and update notification status to `FAILED`.
*   **Duplicate Notifications:** The `AlertProcessorVerticle` should ensure idempotency (e.g., by checking if a notification for the same event already exists) to avoid duplicates.

---

## Conclusion

This implementation plan outlines a pragmatic approach to adding real-time display, alerts, and notifications to the KJU Mess Management System. By leveraging Vert.x worker verticles, we can integrate blocking MongoDB operations without disrupting the existing codebase. The plan includes clear steps for creating new services, routers, and verticles, as well as modifying existing components to publish events to the Event Bus.
