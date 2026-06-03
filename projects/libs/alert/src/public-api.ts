/**
 * Alert Library
 * 
 * A reusable Angular library for displaying non-blocking notification alerts (success, error, warning, info).
 * Supports automatic dismissal, manual dismissal, headings, and interactive action buttons.
 * 
 * Usage:
 * 1. Add `AlertService` to your constructor.
 * 2. Call `success()`, `error()`, `warning()`, or `info()` with the desired message.
 * 3. Alerts with `actionButtonText` will persist until clicked or dismissed.
 */

export * from './lib/alert.models';
export * from './lib/alert.service';
export * from './lib/alert.component';
export * from './lib/alert-container.component';
export * from './lib/alert.module';
